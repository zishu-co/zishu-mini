# 课程完成页

> **路由**：`/pages/finish-course/index?course_id=N`
> **优先级**：P0（方舟学习流闭环 · 必修）
> **完整细节**：[port/archive/001-port-finish-course.md](../../port/archive/001-port-finish-course.md)
> **状态**：✅ done（commit `16a0e20`，2026-06-17）

---

## 1. 目标

把 Vue3 `FinishCourse.vue` 移植为小程序独立页，作为学习流终点：用户学完课程后看到"恭喜"页、结课测验成绩、方舟作业提交（舟长审批）、结课证书（单人）、确认结课按钮。

## 2. 验收标准

- [x] 4 个文件齐全（`{wxml,ts,wxss,json}`）+ `app.json` 注册
- [x] 顶部 🎓 标题 + 课程名正确显示
- [x] 祝福语含用户名（`courseInfo.user_name`）
- [x] 测验区块：`paper_id` 为空时隐藏，否则显示成绩 + "参加测验/重新测验"按钮
- [x] 测验成绩三色样式：未作答（粉）/ 部分分（黄）/ 满分（绿）
- [x] 方舟学习：显示作业区块 + 舟长结课提示
- [x] 单人学习：显示证书区块 + 确认结课按钮
- [x] 确认结课成功后跳回学习页
- [x] 测验跳转：`wx.navigateTo({url: '/pages/exam/index?id='+paper_id})`
- [ ] 微信开发者工具 GUI 验证（需人工）

## 3. 关键路径

- **文件**：`pages/finish-course/{index.wxml, index.ts, index.wxss, index.json}`（4 文件，~800 行）
- **API 封装**：`services/learn/learn.ts` 加 3 个 API（`getFinishCourseInfo` / `confirmFinishCourse` / `submitHomework`）
- **后端**：
  - `GET /api/learn/learn/finish/{course_id}` ✅ 已验证（AmyWu + course_id=1）
  - `POST /api/learn/learn/finish/{course_id}`（方舟学习返回 403）
  - `PATCH /api/learn/learn/finish/{course_id}/homework`
- **调用方**：`pages/learn/index` 课程卡片的"去学习"按钮（章节全部完成时跳转） / `pages/ark-detail` 舟长操作入口

## 4. 状态

- [x] done — 代码完成 + 后端 API 烟测 + commit `16a0e20`
- [ ] shipped — 业务验收通过后移入 `archive/`

**变更历史**：
- 2026-06-17：创建初稿
- 2026-06-17：完成代码 + commit `16a0e20`
