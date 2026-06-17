# 组方舟页

> **路由**：`/pages/ark-group/index?courseId=N`
> **优先级**：P1（方舟管理能力补齐）
> **完整细节**：[port/archive/003-complete-ark-group.md](../../port/archive/003-complete-ark-group.md)
> **状态**：✅ done（commit `ad72b1c`，2026-06-17）

---

## 1. 目标

把 Vue3 `ArkGroup.vue` 移植为小程序独立页，让用户加入现有方舟（按性别限 2 男 / 2 女），或由塾师本人创建方舟。

## 2. 验收标准

- [x] 4 个文件齐全 + `app.json` 注册
- [x] `onLoad(options)` 接收 `courseId` 参数
- [x] 调 `arkListByTeacherAPI` + `arkMyAPI` 加载数据
- [x] 教师卡：塾师名 + 状态徽章（已成舟/待成舟/已结束）
- [x] 操作按钮按 6 种情况分支（加入/已满/已结束/详情链接/创建/未创建）
- [x] 成员名单：性别徽章（男=蓝 / 女=粉）+ 队长 ⭐
- [x] `arkJoinAPI` 成功 → toast + 刷新
- [x] `arkCreateAPI` 成功 → toast + 刷新
- [x] 性别限制：加入按钮按当前用户性别判断
- [x] 空状态：暂无塾师
- [x] learn/index 课程卡片加"加入方舟"入口（紫色 chip `🚢 组方舟`）
- [ ] 微信开发者工具 GUI 验证（需人工）

## 3. 关键路径

- **文件**：`pages/ark-group/{index.wxml, index.ts, index.wxss, index.json}`（4 文件，~400 行）
- **API 封装**：`services/learn/learn.ts` 加 4 个 API（`arkListByTeacher` / `arkMy` / `arkJoin` / `arkCreate`）
- **后端**：
  - `GET /api/learn/ark/list_by_teacher?course_id=N` ✅ 已验证
  - `GET /api/learn/ark/my` ✅ 已验证
  - `POST /api/learn/ark/join` body: `{ark_id}`
  - `POST /api/learn/ark/create` body: `{course_id}`
- **调用方**：`pages/learn/index` 课程卡片的"🚢 组方舟"按钮

## 4. 状态

- [x] done — 代码完成 + 后端 API 烟测 + commit `ad72b1c`
- [ ] shipped — 业务验收通过后移入 `archive/`

**变更历史**：
- 2026-06-17：创建初稿
- 2026-06-17：完成代码 + commit `ad72b1c`
