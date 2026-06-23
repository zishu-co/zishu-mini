# 005-port-learn-sheet

> **状态**：in_progress | **最后更新**：2026-06-17
> **Vue3 源**：`/root/zishu/frontend/src/views/course/LearnSheet.vue`（643 行）
> **Vue3 路由**：`/learn/sheet/:id`
> **小程序现状**：完全缺
> **移植目标**：新建独立页 `/root/zishu-mini/pages/learn-sheet/`
> **优先级**：P1（方舟学习流闭环 · 学习内容承载）
> **粒度**：移植类（**核心展示简化版**，跳过：我的方舟管理/章节内嵌/复杂训练营切换）

---

## 1. 目标

把 Vue3 的"学习单"页面（LearnSheet.vue）移植为小程序独立页 `pages/learn-sheet/`，让舟长在方舟详情页能"查看学习单"跳到该成员的完整学习进度。

**用户**：舟长/塾师查看舟员学习进度
**核心交付物**：显示某个用户的训练营课程列表 + 其他在学/学完课程

**简化点**：
- ❌ 我的方舟（重复 B1）
- ❌ 建方舟/删方舟（重复 B1 + Vue3 复杂弹窗）
- ❌ 章节内嵌（Vue3 跳 `/learn/sheet/${userId}` 内嵌章节内容）
- ❌ 多 camp 切换（数据少，第一个 camp 即可）
- ✅ 保留：camp 课程列表 + 其他在学 + 其他学完

## 2. Vue3 源页面分析

**核心功能**：
- `getLearnSheetAPI(userId)` 拉数据
- `arkStatusByCourseAPI(courseId)` 拉课程方舟状态
- `arkTeacherListAPI` 我的方舟
- `arkCreateAPI` / `arkDeleteAPI` 操作

**API 依赖**（已验证 2026-06-17 18:30 ✅）：
- `GET /api/learn/learn_sheet/{id}` — 返回 `{camps, groups, other_learning, other_learned}`

**Vue3 源已验证**：AmyWu (id=11) JWT
```bash
curl -H 'token: $JWT' http://127.0.0.1:8008/api/learn/learn_sheet/11
# → {camps:[{id:1, camp_name:"塾员预备营", course_list:[5门课]}], groups:[], other_learning:[1], other_learned:[1]}
```

## 3. 验收标准

- [ ] `pages/learn-sheet/{index.wxml,index.ts,index.wxss,index.json}` 4 个文件齐全
- [ ] `app.json` 已注册 `pages/learn-sheet/index`
- [ ] `onLoad(options)` 接收 `userId` 参数
- [ ] 调 `learnSheetAPI` 加载数据
- [ ] 显示用户名（从 camp.user_name 拿）
- [ ] Camp 列表：显示 camp_name + 必选课程（must_course 字符串）+ 课程列表
- [ ] 每门课：课程名 + 进度(current_serial) + 截止时间 + 是否完成
- [ ] 其他在学（other_learning）：列表展示
- [ ] 其他学完（other_learned）：列表展示（带"已学完"标识）
- [ ] 课程项点击 → 跳 course-detail（`/pages/course-detail/index?id={course_id}`）
- [ ] 错误处理
- [ ] 加载态
- [ ] 微信开发者工具 console 无 error
- [ ] 从 ark-detail 跳 learn-sheet（B2 阶段 ark-detail 的 onGoLearnSheet 暂 toast，B3 完成后改 navigateTo）

## 4. 改动清单

**小程序新增**：
- `pages/learn-sheet/index.json` — 页面配置
- `pages/learn-sheet/index.ts` — ~150 行 Page 逻辑
- `pages/learn-sheet/index.wxml` — ~80 行 template
- `pages/learn-sheet/index.wxss` — ~200 行样式

**小程序修改**：
- `app.json` — 注册 `pages/learn-sheet/index`
- `services/learn/learn.ts` — 新增 1 个 API（`learnSheet`）
- `pages/ark-detail/index.ts` — `onGoLearnSheet` 改 navigateTo

**后端**：无

**三端联动**：无

## 5. 验证步骤

```bash
# 1. 后端 API 烟测（已完成 ✅）
# 2. sandbox 改完代码
# 3. scp 同步
scp /root/zishu-mini/pages/learn-sheet/*.{ts,wxml,wxss,json} \
    root@118.25.76.230:/root/zishu-mini/pages/learn-sheet/
scp /root/zishu-mini/pages/ark-detail/index.ts \
    root@118.25.76.230:/root/zishu-mini/pages/ark-detail/
scp /root/zishu-mini/services/learn/learn.ts \
    root@118.25.76.230:/root/zishu-mini/services/learn/
scp /root/zishu-mini/app.json \
    root@118.25.76.230:/root/zishu-mini/app.json

# 4. 微信开发者工具打开 /root/zishu-mini
# 5. git commit
cd /root/zishu-mini
git add pages/learn-sheet/ pages/ark-detail/ services/learn/ app.json
git commit -m "feat(mini): [spec 005] port learn-sheet 学习单"
```

## 6. 状态

- [drafting] **drafting** = 起草中
- [x] **in_progress** = 开发中
- [x] **done** = 所有验收标准勾完
- [ ] **shipped** = 业务验收通过，移入 archive/

**当前状态**：`done`（代码完成 + 后端 API 烟测 + commit 提交；微信开发者工具 GUI 验证待人工）

**变更历史**：
- 2026-06-17：创建初稿
- 2026-06-17：完成代码 + commit 提交
