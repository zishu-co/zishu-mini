# 扫码签到功能 —— 后端（FastAPI）& Web 端（Vue3+TS）开发说明

> 本文档供负责 **Web 端 + 后端** 的 Agent 阅读，是扫码签到功能的联调契约。
> 小程序端（miniprogram-2）将严格按本文档约定的接口开发，**后端接口路径、请求/响应字段必须与本文档一致**，否则两端无法配合。
> 阅读前提：Web 端与后端是既有项目，本文档只描述「新增/必须遵守」的部分，其余遵循你们项目现有约定。

---

## 0. 功能概述

**业务目标**：活动现场墙上贴一张打印出来的二维码。参与者用微信扫一扫 → 直接打开小程序签到页 → 点击「确认签到」→ 调用后端签到接口 → 该参与人 `is_signed_in=true`、`sign_in_time=后端服务器当前时间` → 小程序参与人列表（`pages/event/participants`）实时显示「已签到 + 签到时间」。

**整体流程**：

```
[活动前]
Web 管理端（活动参与人列表页）→ 点「生成签到码」→ 后端调微信接口生成"签到小程序码"
→ Web 端展示/下载图片 → 打印 → 贴到活动现场

[活动现场]
参与者微信「扫一扫」墙上的小程序码
→ 微信直接拉起小程序页面 pages/event/checkin/index（携带 scene 参数）
→ 页面解析出 event_id
→ 检查登录态（未登录先引导登录，登录后回到签到页）
→ 拉取活动详情 + 参与者列表，判断"我是否已报名"
→ 点「确认签到」→ POST 签到接口（后端用 token 识别身份，只允许签自己）
→ 成功：显示「签到成功 + 时间」；活动参与人列表同步变为已签到
```

**两个 Agent 的分工边界**：
- **另一个 Agent（你）负责**：
  1. 后端新增 2 个接口（见 §4）
  2. Web 端加「生成签到码」入口（见 §5）
- **小程序 Agent 负责**（已完成 / 进行中，无需你关心）：
  - 新建签到页 `pages/event/checkin/index`（已在 `app.json` 注册）
  - `services/event/event.ts` 新增 `signIn(eventId)`，调用 §4.1 接口
  - 参与人列表页已支持展示 `is_signed_in` / `sign_in_time`

---

## 1. 环境与部署信息

| 项 | 值 |
|---|---|
| 后端框架 | Python + FastAPI（已有项目，含 DRF 风格路由） |
| 后端开发地址 | `http://127.0.0.1:8008` |
| 后端生产域名 | `https://zishu.co`（小程序体验版/正式版指向此地址） |
| Web 端 | Vue3 + TypeScript（`/root/zishu/frontend`），活动模块在 `src/views/event/` |
| 小程序 appid | `wxb733ab430ac1a423` |
| 现有活动模块 URL 前缀 | `/api/event/`（现有接口均带**尾斜杠**，新增接口请保持一致） |

> 后端服务器需持有小程序 **appid + secret**（用于生成 `access_token` 调微信接口）。secret 按你们现有配置方式（环境变量 / settings）存放，本文档不涉及密钥。

---

## 2. 认证机制（关键，必须遵守）

现有后端认证是**双 Token 机制**，所有接口（除登录/注册）都依赖它。小程序端 `services/base.ts` 已实现「无感刷新」，以下约定是它工作的前提，**后端行为不能改**：

### 2.1 请求头

```
token: <accessToken>          # 注意字段名就是 token，不是 Authorization
content-type: application/x-www-form-urlencoded
```

### 2.2 Token 过期约定（触发小程序端自动刷新）

当 **accessToken 失效** 时，后端**必须**返回：

```
HTTP 401
{"detail": {"code": 5000, "message": "Token Error", "data": "Token Error"}}
```

小程序端识别到 `detail.code === 5000` 后，会拿 refreshToken 调 `GET /api/users/refresh`（header `token: refreshToken`）刷新，成功则自动重试原请求。**刷新接口返回体约定**：`{"id": 5, "atoken": "...", "rtoken": "..."}`（`id > 0` 视为成功，并返回新的 atoken/rtoken 成对下发）。

> 若后端把过期返回成别的格式（如只返回 401 无 detail），小程序端会误判为「未授权」而强制跳登录页，体验中断。**务必保持 `401 + detail.code=5000`**。

### 2.3 鉴权校验

- 受保护接口：从 `token` 请求头解析出当前用户（用户 id / username）。
- **安全红线：不得信任请求体里传来的 `user_id`**。小程序端请求层会自动往 POST body 塞 `user_id`（用于业务筛选），后端**必须忽略它、以 token 解析出的身份为准**，否则任何人可伪造 user_id 帮别人签到。

### 2.4 登录（Web 端复用的现有接口）

```
POST /api/users/token        # 手机号+密码，form-urlencoded
body: phone=xxx&password=xxx
成功返回: {"id": 5, "username": "张三", "atoken": "...", "rtoken": "...", ...}
```

Web 端登录后同样用 `token` 头（atoken）调接口，刷新逻辑可参照小程序（或你们现有 axios 拦截器，保持同样的 401+5000 判定）。

---

## 3. 现有活动模块接口（风格参考，禁止改动）

| 接口 | 方法 | 说明 | 鉴权 |
|---|---|---|---|
| `/api/event/events/current/` | GET | 当前活动列表（`is_finished=false`），**直接返回数组** | 否 |
| `/api/event/events/historical/` | GET | 历史活动列表，直接返回数组 | 否 |
| `/api/event/events/{event_id}/` | GET | 活动详情，直接返回对象 | 否 |
| `/api/event/participants/{event_id}/` | GET | 参与者列表，**直接返回数组** | 否 |
| `/api/event/participants/` | POST | 报名，body `{"event_id": 123}`，成功返回 `{"code": 0, "message": "success", "participant_id": 10}` | 是 |

**响应风格约定**：
- 成功：GET 直接返回业务数据（数组/对象）；POST 返回 `{"code": 0, "message": "success", ...额外字段}`
- 错误：返回 `{"detail": "错误说明"}`（或 `{"detail": {"code": ..., "message": ...}}`）+ 合适的 HTTP 状态码（400 参数错误 / 403 无权限 / 404 不存在 / 401 未授权）

---

## 4. 后端需新增的接口（2 个）

### 4.1 用户自助签到

```
POST /api/event/participants/sign_in/
Content-Type: application/x-www-form-urlencoded
token: <accessToken>          # 鉴权：必须登录

body:
  event_id: 123
```

**后端逻辑（必须全部满足）**：
1. 从 `token` 解析当前用户 id（**不要信 body 里的 user_id**）
2. 校验活动存在，否则 404 `{"detail": "活动不存在"}`
3. 校验当前用户已报名该活动（参与者表存在 `event_id + user_id` 记录），否则 400 `{"detail": "您尚未报名该活动"}`
4. 若该记录已 `is_signed_in=true`：**幂等返回成功**（不要报错，保证重复点击/重复请求安全），返回体同成功（见下），`sign_in_time` 返回已有值
5. 否则置 `is_signed_in=true`、`sign_in_time=后端服务器当前时间`（格式与现有 `join_time` 一致），保存

**成功响应示例**（HTTP 200）：

```json
{
  "code": 0,
  "message": "success",
  "participant_id": 10,
  "is_signed_in": true,
  "sign_in_time": "2026-08-15 19:30:00"
}
```

**错误响应示例**：

```json
HTTP 400
{"detail": "您尚未报名该活动"}

HTTP 401
{"detail": {"code": 5000, "message": "Token Error", "data": "Token Error"}}   // token 过期
```

> 签到时间必须由**后端服务器时间**生成（用户手机时间不可信）。

### 4.2 生成签到小程序码

```
GET /api/event/checkin_qrcode/{event_id}/?env_version=release
token: <accessToken>          # 建议鉴权（Web 管理端调用）
```

**后端逻辑**：
1. 校验活动存在，否则 404
2. 通过微信接口生成**小程序码**（用 `getwxacodeunlimit`，不是普通二维码链接）：

```
# 1) 拿 access_token
GET https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wxb733ab430ac1a423&secret=<你的secret>

# 2) 生成小程序码
POST https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=<ACCESS_TOKEN>
body（JSON）:
{
  "scene": "event_id=12",          # scene 参数：固定格式 event_id=<活动id>
  "page": "pages/event/checkin/index",   # 固定值，小程序签到页路由
  "check_path": false,
  "env_version": "release",        # release=正式版 / trial=体验版，默认 release，允许通过 query 传参覆盖（便于测试）
  "width": 430
}
```

3. 返回**图片二进制**（`image/png`），FastAPI 示例：

```python
from fastapi.responses import Response
return Response(content=image_bytes, media_type="image/png")
```

**scene 格式约定（重要，两端已对齐）**：
- scene 值固定为 `event_id=<数字>`，如 `event_id=12`
- 微信要求 scene 最长 32 字符，且只能含数字、大小写字母及 `!#$&'()*+,/:;=?@-._~`，`event_id=12` 完全合规，**不要对 scene 做 URL 编码**（`=` 在允许字符内）
- 小程序端 `onLoad(options)` 中 `options.scene` 拿到原始值后做一次 `decodeURIComponent`，再正则提取 `event_id=(\d+)` 得到活动 id —— 两端都以这个格式为准

**备选方案**（若你们倾向返回 JSON）：可返回 `{"code": 0, "data": {"qrcode_url": "<图片URL>", "base64": "<base64图片>"}}`，但**必须二选一并告知小程序 Agent**，本文档默认采用「直接返回图片二进制」。

> 注意事项：
> - `getwxacodeunlimit` 生成的小程序码**只有小程序发布正式版（env_version=release）或体验版（env_version=trial）时扫了才有效**；开发版（develop）扫码无效
> - 建议后端对同一 `event_id` 的小程序码做**短期缓存**（如内存/Redis 缓存 10 分钟），避免每次点击都调微信接口（微信接口有配额限制）
> - `env_version` 建议做成 query 参数（默认 `release`），Web 端测试时切换 `trial` 生成体验版码，配合体验版小程序调试

---

## 5. Web 端需实现的功能

**入口位置**：活动参与人列表页（`src/views/event/ParticipantList.vue`，路由 `/event/:id/participants`）的管理员区域，新增「生成签到码」按钮（与管理员的签到/删除操作按钮放一起）。

**交互流程**：
1. 管理员进入某活动的参与人列表页，点击「生成签到码」
2. 前端调 `GET /api/event/checkin_qrcode/{event_id}/`（带 `token` 头）
3. 收到 `image/png` 二进制 → 用 `URL.createObjectURL(new Blob([res.data]))` 生成临时 URL → `<img>` 弹窗/抽屉展示二维码
4. 提供「下载图片」按钮（`<a download>`）或提示长按保存，供打印
5. 展示时同时显示活动标题 + 提示文案：「请将此二维码打印后张贴于活动现场，参与者微信扫码即可签到」
6. 若接口报 401（token 过期），走你们现有的无感刷新 / 重新登录流程

**其他建议（非必须）**：
- 生成前可让管理员选择「正式版 / 体验版」码（对应 `env_version`），便于上线前用体验版测试
- 如你们已有管理员角色体系，签到码接口的权限校验沿用现有 admin 判定逻辑；若没有，至少要求登录态

---

## 6. 数据结构约定（两端一致，勿改字段名）

### 活动 EventItem

```typescript
interface EventItem {
  id: number
  title: string
  poster: string          // 海报图 URL
  url: string             // 宣传链接（注意：这是宣传文案链接，不是小程序码）
  desc: string | null
  start_time: string      // "2024-01-01T12:30:00.123456"（ISO 带毫秒）
  location: string
  is_finished: boolean
  finished_time: string | null
  participant_count: number
  related_id: number | null
  related_type: string | null
  created_at: string
  updated_at: string
}
```

### 参与者 ParticipantItem

```typescript
interface ParticipantItem {
  id: number
  user_id: number
  username: string
  event_id: number
  join_time: string
  sign_in_time: string | null   // 未签到为 null
  payed_amount: number
  payment_method: string
  is_payed: boolean
  is_signed_in: boolean         // 签到状态，本次功能的落点
  absence_reason: string | null
  created_at: string
  updated_at: string
}
```

`GET /api/event/participants/{event_id}/` 返回的就是 `ParticipantItem[]` 数组（保持该格式，**不要改动**，参与人列表页依赖它）。

---

## 7. 联调验收清单

- [ ] `POST /api/event/participants/sign_in/`：未登录 → 401；未报名 → 400；已报名未签到 → 200 且 `is_signed_in=true`、`sign_in_time` 为后端当前时间；重复调用 → 幂等成功
- [ ] 签到后 `GET /api/event/participants/{event_id}/` 中该记录 `is_signed_in=true`、`sign_in_time` 有值
- [ ] token 过期调用签到接口 → 返回 `401 + {"detail": {"code": 5000, ...}}`
- [ ] `GET /api/event/checkin_qrcode/{event_id}/` → 返回 PNG 图片，扫描后能拉起小程序 `pages/event/checkin/index`，`onLoad` 的 `options.scene` 为 `event_id=<id>`
- [ ] Web 端参与人列表页出现「生成签到码」按钮，能展示并下载二维码图片

**测试方法提示**：
- 后端接口用 curl 即可烟测（见 §4 请求/响应示例）
- 小程序端联调：在微信开发者工具「编译模式」中配置启动参数 `scene=event_id%3D12` 模拟扫码进入签到页（`%3D` 是 `=` 的 URL 编码，工具传参需编码）；真机验证需把小程序上传为**体验版**后，用 `env_version=trial` 生成的码扫码

---

## 8. 风险与提醒

1. **防伪造**：签到身份判定必须用 `token` 解析的用户，忽略 body 里的 `user_id`（小程序请求层会自动附加，勿被误导）
2. **防重复签到**：后端幂等处理，已签到再调返回成功而非报错
3. **时间归属**：`sign_in_time` 用后端服务器时间
4. **扫码即本人**：扫码签到本质是「谁拿手机扫谁签」，无法防止代签；如需人证核验，小程序签到页会展示本人头像昵称，由现场工作人员目视核对（小程序端已考虑，无需后端处理）
5. **微信接口配额**：小程序码生成接口有频率限制，务必缓存
6. **只能签自己**：该接口只允许用户签自己的参与记录；管理员手动帮他人签到继续走 Web 端现有功能，不要混用此接口
