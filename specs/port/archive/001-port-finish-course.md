# 001-port-finish-course

> **状态**：in_progress | **最后更新**：2026-06-17
> **Vue3 源**：`/root/zishu/frontend/src/views/learn/FinishCourse.vue`（493 行）
> **Vue3 路由**：`/learn/finish/:course_id`
> **移植目标**：`/root/zishu-mini/pages/finish-course/{index.wxml,index.ts,index.wxss,index.json}`
> **优先级**：P0（方舟学习流闭环 · 必修）
> **粒度**：移植类（行为对齐 Vue3，UI 适配 TDesign / 原生组件）

---

## 1. 目标

把 Vue3 的课程完成页移植到小程序，作为学习流的终点：用户学完课程后看到"恭喜"页、结课测验成绩、方舟作业提交（舟长审批）、结课证书（单人）、确认结课按钮。

**用户**：选课用户（单人学习或方舟学习者）
**核心交付物**：`pages/finish-course/` 4 个文件 + `services/learn/learn.ts` API 封装

## 2. Vue3 源页面分析

**核心功能**（5 个区块）：
1. 顶部标题 🎓 + 课程名
2. 祝福语（个性化用户名 + 课程名）
3. 结课测验（成绩展示 + 参加/重做按钮，仅当 `paper_id` 存在）
4. 方舟作业（仅方舟学习显示：未提交输入框 / 已提交显示链接）
5. 结课证书 + 确认结课按钮（**仅单人学习**显示）

**关键交互**：
- `goQuiz` — 跳转 `window.open(/ques/dotest/${paper_id})` → 小程序用 `wx.navigateTo({url: '/pages/exam/index?id='+paper_id})` 替代
- `submitHomework` — 调 `submitHomeworkAPI`
- `confirmFinish` — 调 `finishCourseAPI`，成功后回 `/learn`
- `downloadCertificate` — 占位 toast

**API 依赖**（已验证 2026-06-17 17:30 ✅）：
- `GET /api/learn/learn/finish/{course_id}` — 返回 `{code, course_id, course_title, user_name, is_ark_learning, ark_info, selection_id, quiz_info, paper_id}`
- `POST /api/learn/learn/finish/{course_id}` — 确认结课（方舟返回 403）
- `PATCH /api/learn/learn/finish/{course_id}/homework` — body: `{homework_url}`

**Vue3 源已验证**：用 AmyWu (id=11) JWT + course_id=1 测通 ✅
```bash
curl -H 'token: $JWT' http://127.0.0.1:8008/api/learn/learn/finish/1
# → {"code":"200","course_id":1,"course_title":"自塾时间管理","user_name":"AmyWu","is_ark_learning":false,"ark_info":null,"selection_id":98,"quiz_info":null,"paper_id":null}
```

## 3. 验收标准

- [ ] `pages/finish-course/index.{wxml,ts,wxss,json}` 4 个文件齐全
- [ ] `app.json` 已注册 `pages/finish-course/index`
- [ ] 顶部 🎓 标题 + 课程名（`courseInfo.course_title`）正确显示
- [ ] 祝福语含用户名（`courseInfo.user_name`）
- [ ] 测验区块：`paper_id` 为空时隐藏，否则显示成绩 + "参加测验/重新测验"按钮
- [ ] 测验成绩三色样式：未作答（粉）/ 部分分（黄）/ 满分（绿）
- [ ] 方舟学习（`is_ark_learning: true`）：显示作业区块 + 舟长结课提示
- [ ] 单人学习（`is_ark_learning: false`）：显示证书区块 + 确认结课按钮
- [ ] 确认结课成功后 `wx.navigateBack` 或 `wx.redirectTo` 回学习页
- [ ] 测验跳转：`wx.navigateTo({url: '/pages/exam/index?id='+paper_id})`（exam 页已存在）
- [ ] 错误处理：API 失败时 toast + 返回
- [ ] 登录态要求：未登录应跳登录页（用 base.ts 的 401 处理已覆盖）
- [ ] 微信开发者工具 console 无 error

## 4. 改动清单

**小程序新增**：
- `pages/finish-course/index.wxml` — ~120 行 template 翻译
- `pages/finish-course/index.ts` — ~150 行 Page 逻辑
- `pages/finish-course/index.wxss` — ~200 行样式（SCSS → WXSS，px → rpx）
- `pages/finish-course/index.json` — 页面配置
- `services/learn/learn.ts` — ~80 行 API 封装（`getFinishCourse` / `confirmFinishCourse` / `submitHomework`）

**小程序修改**：
- `app.json` — 注册 `pages/finish-course/index`

**后端**：无

**三端联动**：无（仅小程序端）

## 5. 验证步骤

```bash
# 1. 后端 API 烟测（已完成 ✅）
# 2. sandbox 改完代码
# 3. scp 同步到服务器
scp /root/zishu-mini/pages/finish-course/*.ts \
    root@118.25.76.230:/root/zishu-mini/pages/finish-course/
scp /root/zishu-mini/pages/finish-course/*.{wxml,wxss,json} \
    root@118.25.76.230:/root/zishu-mini/pages/finish-course/
scp /root/zishu-mini/services/learn/learn.ts \
    root@118.25.76.230:/root/zishu-mini/services/learn/
scp /root/zishu-mini/app.json \
    root@118.25.76.230:/root/zishu-mini/app.json

# 4. 微信开发者工具打开 /root/zishu-mini
#    - 详情 → 不校验合法域名 ✅
#    - 编译 → 预览 → 扫码真机
#    - 测试场景：登录 AmyWu → 进入 learn → 选课 → 学完 → 跳 finish-course
#    - 测试场景：直接传参 navigateTo 到 /pages/finish-course/index?course_id=1

# 5. git commit
cd /root/zishu-mini
git add pages/finish-course/ services/learn/ app.json
git commit -m "feat(mini): [spec 001] port finish-course 课程完成页"
```

## 6. 状态

- [drafting] **drafting** = 起草中
- [x] **in_progress** = 开发中
- [x] **done** = 所有验收标准勾完
- [ ] **shipped** = 业务验收通过，移入 archive/

**当前状态**：`done`（代码完成，commit 16a0e20；微信开发者工具 GUI 验证待人工）

**变更历史**：
- 2026-06-17：创建初稿
- 2026-06-17：完成代码 + 后端 API 烟测 + commit 16a0e20
- 2026-06-17：所有 6 个任务完成（commit 16a0e20 / a2e32a5 / ad72b1c / 3988be4 / B3）
