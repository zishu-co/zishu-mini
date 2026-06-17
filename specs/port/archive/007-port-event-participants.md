# 007-port-event-participants

> **状态**：in_progress | **最后更新**：2026-06-17
> **Vue3 源**：`/root/zishu/frontend/src/views/event/ParticipantList.vue`（373 行）
> **Vue3 路由**：`/event/:id/participants`
> **小程序现状**：完全缺，需新建
> **移植目标**：`/root/zishu-mini/pages/event/participants/index.{wxml,ts,wxss,json}`
> **优先级**：P1（从 EventList 标题点击进入）
> **粒度**：移植类（**普通用户视角** — 砍掉所有 admin 操作：签到/删除参与人）
> **依赖**：spec 006（需要 `services/event/event.ts` 已实现）

---

## 1. 目标

把 Vue3 端 ParticipantList 移植为小程序 `pages/event/participants/` 页。**只面向普通用户**（可看不可改），admin 操作（签到/删除）不在小程序暴露。

**用户**：查看活动参与者名单的塾员/游客
**核心交付物**：
- 顶部活动信息卡（海报 / 标题 / 时间 / 地点 / 描述 / 返回按钮 / 查看宣传文案）
- 参与者列表（姓名 / 报名时间 / 支付状态 / 支付金额 / 支付方式 / 签到状态 / 签到时间）

## 2. Vue3 源页面分析

**核心功能**（从 .vue 抽出）：
- 进入页面：并行 `getEventAPI(eventId)` 拉详情 + `fetchParticipantsAPI(eventId)` 拉参与者列表
- 顶部活动信息卡：海报（点击跳宣传 url）/ 标题 / 时间 / 地点 / 描述 / 「返回活动列表」按钮 / 「查看宣传文案」按钮
- 参与者列表（`el-table`）：
  - 姓名 username
  - 报名时间 join_time
  - 支付状态 is_payed（"已支付" / "未支付" tag）
  - 支付金额 payed_amount
  - 支付方式 payment_method
  - 签到状态 is_signed_in（"已签到" / "未签到" tag）
  - 签到时间 sign_in_time
- admin 操作：未签到显示"签到"按钮 + 永远显示"删除"按钮（**砍掉，不移植**）

**关键交互**：
- 海报点击 → 跳 webview 显示宣传链接（**复用 spec 006 的 webview 容器页**）
- 查看宣传文案 → 同上
- 返回活动列表 → `wx.navigateBack`

**API 依赖**（**单一事实源**：`frontend/src/request/event/api.ts`）：
- `GET /api/event/events/{event_id}/` — 活动详情
- `GET /api/event/participants/{event_id}/` — 参与者列表

**后端 0 改动**（验证 2026-06-17 ✅）：

```bash
# 验证 1：活动详情
curl -s http://118.25.76.230:8008/api/event/events/2/
# → 完整字段：title, poster, url, desc, start_time, location, is_finished, participant_count, ...

# 验证 2：参与者列表
curl -s http://118.25.76.230:8008/api/event/participants/2/
# → [{id, join_time, payed_amount, is_payed, absence_reason, updated_at, sign_in_time,
#     user_id, event_id, payment_method, is_signed_in, created_at, username}, ...]
#   （participant_count: 1，对应 "Susan"）
```

## 3. 验收标准

- [ ] `pages/event/participants/index.{wxml,ts,wxss,json}` 4 件套齐全
- [ ] `app.json` 已注册 `pages/event/participants/index`
- [ ] `onLoad(options)` 接收 `id` 参数
- [ ] 并行调 `getEvent(id)` + `fetchParticipants(id)` 加载数据
- [ ] 顶部活动信息卡：海报 / 标题 / 时间 / 地点 / 描述
- [ ] 「返回活动列表」按钮（`wx.navigateBack`）
- [ ] 「查看宣传文案」按钮（仅当 `eventInfo.url` 非空时显示）
- [ ] 海报点击 → 跳 `pages/event/webview/index?url={encodeURIComponent(eventInfo.url)}`（**复用 spec 006 容器**）
- [ ] 参与者列表（手写卡片，不用 t-table）：姓名 / 报名时间 / 支付状态（已支付/未支付 tag）/ 支付金额 / 支付方式 / 签到状态（已签到/未签到 tag）/ 签到时间
- [ ] 空数据：显示"暂无参与人"
- [ ] 加载态：有 loading 提示
- [ ] 错误处理：活动不存在（404）→ `wx.navigateBack`
- [ ] **不显示**：签到按钮 / 删除参与人按钮（任何 admin 操作入口）
- [ ] 微信开发者工具 console 无 error
- [ ] OpenClaw 4 个测试账号都能跑通核心场景

## 4. 改动清单

**小程序新增**：
- `pages/event/participants/index.wxml` — 参与者页模板（活动信息卡 + 参与者列表）
- `pages/event/participants/index.ts` — 参与者页逻辑（~120 行）
- `pages/event/participants/index.wxss` — 参与者页样式
- `pages/event/participants/index.json` — 页面配置

**小程序修改**：
- `app.json` — 注册 `pages/event/participants/index`
- `services/event/event.ts` — 新增 2 个 API（`getEvent` + `fetchParticipants`）—— **跟 spec 006 一起在同一次重写中完成**

**后端**：无

**三端联动**：无（仅小程序端）

## 5. 验证步骤

```bash
# 1. 后端 API 烟测（已完成 2026-06-17 ✅，见 §2）

# 2. sandbox 改完代码

# 3. scp 同步到服务器
scp -r /root/zishu-mini/pages/event/participants/ \
    root@118.25.76.230:/root/zishu-mini/pages/event/
scp /root/zishu-mini/app.json \
    root@118.25.76.230:/root/zishu-mini/app.json

# 4. 微信开发者工具打开 /root/zishu-mini
#    - 详情 → 不校验合法域名 ✅
#    - 编译 → 预览 → 扫码真机

# 5. OpenClaw 跑核心场景
#    a) 从 EventList 点击任意活动标题 → 跳 participants 页
#    b) 看到活动信息卡（海报/标题/时间/地点/描述）
#    c) 看到参与者列表（至少 1 个 participant）
#    d) 不显示「签到」「删除」按钮
#    e) 点击「返回活动列表」→ 回到 EventList
#    f) （如有 url）点击海报 / 「查看宣传文案」→ 跳 webview

# 6. git commit
cd /root/zishu-mini
git add pages/event/participants/ app.json \
        specs/port/archive/007-port-event-participants.md
git commit -m "feat(mini): [spec 007] port event participants（普通用户视角）"
```

## 6. 状态

- [drafting] **drafting** = 起草中
- [x] **in_progress** = 开发中
- [ ] **done** = 所有验收标准勾完
- [ ] **shipped** = 业务验收通过

**当前状态**：`in_progress`

**变更历史**：
- 2026-06-17：创建初稿（基于 Vue3 ParticipantList.vue + 后端 API 烟测通过）

---

## 附录：移植检查点

- [x] v-if → wx:if，v-for → wx:for（**wx:key 必填**）
- [x] @click → bindtap
- [x] :prop → `prop="{{value}}"`
- [x] axios → 自封装 `request({...})`（跟 `services/learn/learn.ts` 风格一致）
- [x] localStorage → `wx.storage` API
- [x] px → rpx（1px ≈ 2rpx @ 750rpx 设计稿）
- [x] `<style scoped>` → 无 scoped
- [x] Element Plus 组件 → TDesign 对应组件 / 自实现
  - `el-table` + `el-table-column` → **手写卡片列表**（`<view>` + `wx:for`），小程序表格体验差
  - `el-tag` → TDesign `t-tag`（路径带 `miniprogram_dist/`）
  - `el-button` → TDesign `t-button`
  - `ElMessage` → TDesign `Toast` 或 `wx.showToast`
- [x] baseURL 已在 `services/base.ts` 自动用 `https://zishu.co`
- [x] Token header 字段名是 `token`
- [x] 登录端点用 form-urlencoded

## 附录：UI 调整说明（Vue3 → 小程序）

**Vue3 端 `el-table` 8 列**（姓名/报名时间/支付状态/支付金额/支付方式/签到状态/签到时间/操作），在小程序上**改卡片列表**：

```
┌─────────────────────────────┐
│ 张三                          │
│ 🕐 2026-05-24 17:51          │
│ 💰 已支付 ¥200 (wechat)       │
│ ✓ 已签到 2026-05-24 18:15    │
└─────────────────────────────┘
┌─────────────────────────────┐
│ 李四                          │
│ 🕐 2026-05-25 09:30          │
│ 💰 未支付 -                   │
│ ○ 未签到 -                    │
└─────────────────────────────┘
```

每张卡片内字段垂直排列，比表格在小屏（手机）体验更好。
