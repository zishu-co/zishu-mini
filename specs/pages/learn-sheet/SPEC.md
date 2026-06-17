# 学习单页

> **路由**：`/pages/learn-sheet/index?userId=N`
> **优先级**：P1（方舟学习流闭环 · 学习内容承载）
> **完整细节**：[port/archive/005-port-learn-sheet.md](../../port/archive/005-port-learn-sheet.md)
> **状态**：✅ done（commit `13fb6ad`，2026-06-17）

---

## 1. 目标

把 Vue3 `LearnSheet.vue` 移植为小程序独立页，让舟长在方舟详情页能"查看学习单"跳到该成员的完整学习进度。

## 2. 验收标准

- [x] 4 个文件齐全 + `app.json` 注册
- [x] `onLoad(options)` 接收 `userId` 参数
- [x] 调 `learnSheetAPI` 加载数据
- [x] 显示用户名（从 camp.user_name 拿，动态设置导航栏标题）
- [x] Camp 列表：显示 camp_name + 必选课程 + 课程列表
- [x] 每门课：课程名 + 进度(current_serial) + 截止时间 + 是否完成
- [x] 其他在学（other_learning）：列表展示
- [x] 其他学完（other_learned）：列表展示（带"已学完"标识）
- [x] 课程项点击 → 跳 course-detail
- [x] 错误处理 + 加载态
- [x] 从 ark-detail 跳 learn-sheet（已改 onGoLearnSheet）
- [ ] 微信开发者工具 GUI 验证（需人工）

## 3. 关键路径

- **文件**：`pages/learn-sheet/{index.wxml, index.ts, index.wxss, index.json}`（4 文件，~400 行）
- **API 封装**：`services/learn/learn.ts` 加 1 个 API（`learnSheet`）
- **后端**：
  - `GET /api/learn/learn_sheet/{user_id}` ✅ 已验证（AmyWu id=11）
- **调用方**：`pages/ark-detail/index` 成员卡的"📖 查看学习单"按钮

## 4. 状态

- [x] done — 代码完成 + 后端 API 烟测 + commit `13fb6ad`
- [ ] shipped — 业务验收通过后移入 `archive/`

**变更历史**：
- 2026-06-17：创建初稿
- 2026-06-17：完成代码 + commit `13fb6ad`

**简化点**：
- ❌ 我的方舟管理（重复 ark-group）
- ❌ 建方舟/删方舟（复杂弹窗）
- ❌ 章节内嵌
- ❌ 多 camp 切换（数据少）
