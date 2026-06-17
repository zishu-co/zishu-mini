# 方舟详情页

> **路由**：`/pages/ark-detail/index?arkId=N`
> **优先级**：P1（方舟管理能力补齐）
> **完整细节**：[port/archive/004-complete-ark-detail.md](../../port/archive/004-complete-ark-detail.md)
> **状态**：✅ done（commit `3988be4`，2026-06-17）

---

## 1. 目标

把 Vue3 `ArkDetail.vue` 移植为小程序独立页，显示方舟基本信息、成员进度、关键管理操作（设舟长 / 三会 / 完结 / 退出）。

## 2. 验收标准

- [x] 4 个文件齐全 + `app.json` 注册
- [x] `onLoad(options)` 接收 `arkId` 参数
- [x] 调 `arkDetailAPI` 加载方舟详情
- [x] 状态栏：阶段徽章（筹建中/已成舟）+ 已结束 tag
- [x] 总进度条：百分比
- [x] 塾师名显示
- [x] 成员列表：每行 = 用户名 + 队长 ⭐ / 性别 / 进度条 / 学习单链接
- [x] 角色判断 4 种操作按钮（设我为舟长 / 编辑三会 / 完结 / 退出）
- [x] 三会弹窗：6 个字段（3 会议码 + 3 时间），保存 → 调 API
- [x] 完结方舟：确认弹窗 → 调 API
- [x] 退出方舟：确认弹窗 → 调 API + 返回上一页
- [x] 错误处理 + 加载态
- [x] 从 ark-group 跳 ark-detail（已改 onGoDetail）
- [x] 从 my/my 跳 ark-detail（已改 onArkTap）
- [x] 跳 learn-sheet（成员卡"查看学习单"按钮）
- [ ] 微信开发者工具 GUI 验证（需人工）

## 3. 关键路径

- **文件**：`pages/ark-detail/{index.wxml, index.ts, index.wxss, index.json}`（4 文件，~1000 行）
- **API 封装**：`services/learn/learn.ts` 加 5 个 API（`arkDetail` / `arkSetCaptain` / `arkSaveMeetings` / `arkGetMeetings` / `arkClose` / `arkLeave`）
- **后端**：
  - `GET /api/learn/ark/detail/{ark_id}` ✅ 已验证（ark_id=4, AmyWu）
  - `POST /api/learn/ark/set_captain` body: `{ark_id, [captain_user_id]}`
  - `POST /api/learn/ark/meetings` body: `{ark_id, meet_*, meet_*_time}`
  - `GET /api/learn/ark/meetings/{ark_id}`
  - `POST /api/learn/ark/close` body: `{ark_id}`
  - `POST /api/learn/ark/leave` body: `{ark_id}`
- **调用方**：
  - `pages/ark-group/index` 详情链接
  - `pages/my/my` 我的方舟卡片
  - `pages/ark-detail` 内成员卡 → `pages/learn-sheet`

## 4. 状态

- [x] done — 代码完成 + 后端 API 烟测 + commit `3988be4`
- [ ] shipped — 业务验收通过后移入 `archive/`

**变更历史**：
- 2026-06-17：创建初稿
- 2026-06-17：完成代码 + commit `3988be4`

**简化点**（与 Vue3 区别，详见 port/archive 文档）：
- ❌ 踢人（敏感操作，留给管理端）
- ❌ 统一结课（舟长操作，逻辑复杂）
- ❌ 学习单内嵌（独立成页 learn-sheet）
- ❌ 管理员视图
