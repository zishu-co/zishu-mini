# 006-port-event-list

> **状态**：in_progress | **最后更新**：2026-06-17
> **Vue3 源**：`/root/zishu/frontend/src/views/event/EventList.vue`（449 行）
> **Vue3 路由**：`/events`
> **小程序现状**：已存在 `pages/event/index` + 3 个 demo 组件（event-group/goods-card/specs-popup）—— **完全不相关**（TDesign 商城 demo 占位 — storeGoods/spuId/promotion），需清空重建
> **移植目标**：
>   - `pages/event/index.{wxml,ts,wxss,json}`（TabBar 第 4 项"活动"，重写）
>   - `pages/event/webview/index.{wxml,ts,wxss,json}`（公众号文章 webview 容器，新建）
> **优先级**：P0（TabBar 必做）
> **粒度**：移植类（**普通用户视角** — 砍掉所有 admin 操作：编辑/删除/创建）
> **不移植**：EventForm（admin 用，浏览器操作）；admin 鉴权不涉及

---

## 1. 目标

把 Vue3 端 EventList 移植为小程序 TabBar 第 4 项"活动"列表页 + 海报跳转公众号文章的 webview 容器页。**只面向普通用户**，admin 操作不在小程序暴露。

**用户**：报名参加活动的塾员/游客
**核心交付物**：
- 顶部 tab 切换（当前活动 / 历史活动）
- 活动卡片网格（海报 / 标题 / 时间 / 地点 / 参与人数 / 描述）
- 海报点击 → 跳 webview 显示公众号文章
- 标题点击 → 跳 participants 详情
- 当前活动可「报名参加」（confirm 弹窗 → 调 joinEvent API）
- 历史活动不显示报名按钮，加"已结束"标识

## 2. Vue3 源页面分析

**核心功能**（从 .vue 抽出）：
- 顶部 tab 切换 current / historical
- 卡片网格：海报（点击跳宣传 url）/ 标题（点击跳 participants）/ 时间 / 地点 / 参与人数 / 描述
- 普通用户：报名参加（confirm 弹窗"请先确认您已在「活动行」或「粗门」平台完成报名，再点击确认加入"）
- admin：+ 创建活动 / 编辑 / 删除（**砍掉，不移植**）
- 海报点击 → `window.open(url)` 打开宣传链接 → **小程序改 web-view 容器页**

**关键交互**：
- 报名 confirm："请先确认您已在「活动行」或「粗门」平台完成报名，再点击确认加入"
- 报名成功：Toast "报名成功！"
- 报名失败：Toast 错误信息

**API 依赖**（**单一事实源**：`frontend/src/request/event/api.ts`，非 spec 100/101）：
- `GET /api/event/events/current/` — 拉当前活动（`is_finished=False`）
- `GET /api/event/events/historical/` — 拉历史活动（`is_finished=True`）
- `POST /api/event/participants/` — 报名（body: `{event_id}`，触发 `event_join` 动作钩子）

**后端 0 改动**（API 全有，验证 2026-06-17 ✅）：

```bash
# 验证 1：拉当前活动
curl -s http://118.25.76.230:8008/api/event/events/current/
# → 2 条活动数据（TestDB2 / APITest），字段完整

# 验证 2：拉历史活动
curl -s http://118.25.76.230:8008/api/event/events/historical/
# → 历史活动列表（GitHubCommitTest 等），字段完整

# 验证 3：登录拿 token
curl -s -X POST http://118.25.76.230:8008/api/users/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "phone=18817357081&password=zishu"
# → {id:11, username:"AmyWu", atoken:"eyJ...", rtoken:"eyJ...", phone:"18817357081", role:"user"}
```

## 3. 验收标准

- [ ] `pages/event/index.{wxml,ts,wxss,json}` 4 件套齐全（**重写**）
- [ ] `pages/event/webview/index.{wxml,ts,wxss,json}` 4 件套齐全（新建）
- [ ] `app.json` 已注册 `pages/event/webview/index`
- [ ] `services/event/event.ts` 完全重写（5 API + 2 types，**自封装 request 风格**跟 learn.ts 一致）
- [ ] `pages/event/components/` 目录已删除（3 个 demo 组件全清）
- [ ] 顶部 tab 切换：当前活动 / 历史活动（点击切换 + 状态高亮）
- [ ] 活动卡片：海报（image）/ 标题 / 时间 / 地点 / 参与人数 / 描述
- [ ] 海报点击 → 跳 `pages/event/webview/index?url={encodeURIComponent(evt.url)}`
- [ ] 标题点击 → 跳 `pages/event/participants/index?id={evt.id}`
- [ ] 当前活动卡片有「报名参加」按钮
- [ ] 历史活动卡片**没有**报名按钮 + 显示"已结束"标识
- [ ] 报名 confirm 弹窗文案："请先确认您已在「活动行」或「粗门」平台完成报名，再点击确认加入"
- [ ] 报名成功：Toast "报名成功！"
- [ ] 报名失败：Toast 错误信息
- [ ] 空数据：当前显示"暂无进行中的活动" / 历史显示"暂无历史活动"
- [ ] 加载态：有 loading 提示
- [ ] 错误处理：网络失败 / 接口 500
- [ ] **不显示**：创建活动按钮 / 编辑按钮 / 删除按钮（任何 admin 操作入口）
- [ ] 微信开发者工具 console 无 error
- [ ] OpenClaw 4 个测试账号都能跑通核心场景

## 4. 改动清单

**小程序新增**：
- `pages/event/webview/index.wxml` — 5 行（`<web-view src="{{url}}" />`）
- `pages/event/webview/index.ts` — 15 行（解析 url 参数）
- `pages/event/webview/index.wxss` — 5 行
- `pages/event/webview/index.json` — 页面配置

**小程序重写**：
- `pages/event/index.wxml` — EventList 模板（tab + 卡片列表 + 报名按钮）
- `pages/event/index.ts` — EventList 逻辑（~180 行）
- `pages/event/index.wxss` — EventList 样式
- `pages/event/index.json` — 页面配置
- `services/event/event.ts` — 完全重写（5 API + 2 types，~120 行，**自封装 request 风格**）

**小程序删除**：
- `pages/event/components/event-group/`（整个目录，含 2 个 wxs）
- `pages/event/components/goods-card/`（整个目录）
- `pages/event/components/specs-popup/`（整个目录）
- `pages/event/components/` 空目录

**小程序修改**：
- `app.json` — 注册 `pages/event/webview/index`

**后端**：无（API 全有）

**三端联动**：无（仅小程序端）

## 5. 验证步骤

```bash
# 1. 后端 API 烟测（已完成 2026-06-17 ✅，见 §2）

# 2. sandbox 改完代码

# 3. scp 同步到服务器
scp -r /root/zishu-mini/pages/event/index.* \
       /root/zishu-mini/pages/event/webview/ \
       root@118.25.76.230:/root/zishu-mini/pages/event/
scp /root/zishu-mini/services/event/event.ts \
    root@118.25.76.230:/root/zishu-mini/services/event/
scp /root/zishu-mini/app.json \
    root@118.25.76.230:/root/zishu-mini/app.json

# 4. 微信开发者工具打开 /root/zishu-mini
#    - 详情 → 不校验合法域名 ✅
#    - 编译 → 预览 → 扫码真机

# 5. OpenClaw 跑核心场景（4 个测试账号）
#    a) 切到"活动" TabBar → 看到当前活动列表（至少 1 条）
#    b) 切换"历史活动" tab → 看到历史活动（至少 1 条）
#    c) 点击当前活动的"报名参加" → 弹 confirm → 确认 → 报名成功 Toast
#    d) 点击海报（如有 url）→ 跳 webview 显示公众号文章
#    e) 点击标题 → 跳 participants 详情页

# 6. git commit
cd /root/zishu-mini
git add pages/event/index.* pages/event/webview/ \
        services/event/event.ts app.json \
        specs/port/archive/006-port-event-list.md
git commit -m "feat(mini): [spec 006] port event list + webview 容器（普通用户视角）"
```

## 6. 状态

- [drafting] **drafting** = 起草中
- [x] **in_progress** = 开发中
- [ ] **done** = 所有验收标准勾完
- [ ] **shipped** = 业务验收通过

**当前状态**：`in_progress`

**变更历史**：
- 2026-06-17：创建初稿（基于 Vue3 EventList.vue + 后端 API 烟测通过）

---

## 附录：移植检查点

- [x] v-if → wx:if，v-for → wx:for（**wx:key 必填**）
- [x] @click → bindtap
- [x] :prop → `prop="{{value}}"`
- [x] axios → 自封装 `request({...})`（跟 `services/learn/learn.ts` 风格一致，**不用** `services/base.ts` 大类）
- [x] localStorage → `wx.storage` API
- [x] px → rpx（1px ≈ 2rpx @ 750rpx 设计稿）
- [x] `<style scoped>` → 无 scoped
- [x] Element Plus 组件 → TDesign 对应组件
  - `el-tabs` → 自实现顶部 tab（小程序 t-tabs 体验一般）
  - `el-button` → TDesign `t-button`（路径带 `miniprogram_dist/`）
  - `ElMessage` → TDesign `Toast` 或 `wx.showToast`
  - `ElMessageBox` → TDesign `Dialog.confirm`
- [x] baseURL 已在 `services/base.ts` 自动用 `https://zishu.co`（**不要再写 127.0.0.1**）
- [x] Token header 字段名是 `token`（**不是** `Authorization: Bearer`）—— 已在 base.ts 处理
- [x] 登录端点用 form-urlencoded（**不是 JSON**）—— 已在 base.ts 默认
- [x] `window.open(url)` → web-view 容器页（公众号文章兼容）

## 附录：小程序 API 封装约定（自封装 request 风格）

```typescript
// services/event/event.ts 模板
function getToken(): string {
  return wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || ''
}

function request<T = any>(options: {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  showLoading?: boolean
}): Promise<T> {
  return new Promise((resolve, reject) => {
    if (options.showLoading) wx.showLoading({ title: '加载中...', mask: true })
    wx.request({
      url: 'https://zishu.co' + options.url,  // 或通过 base.ts 的 getBaseUrl()
      method: (options.method || 'GET') as any,
      data: options.data,
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'token': getToken(),
      },
      success: (res: any) => {
        if (options.showLoading) wx.hideLoading()
        if (res.statusCode === 401) {
          reject({ statusCode: 401, errMsg: 'Unauthorized' })
          return
        }
        resolve(res.data as T)
      },
      fail: (err) => {
        if (options.showLoading) wx.hideLoading()
        reject(err)
      },
    })
  })
}
```
