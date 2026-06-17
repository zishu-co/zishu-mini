# 004-complete-ark-detail

> **状态**：in_progress | **最后更新**：2026-06-17
> **Vue3 源**：`/root/zishu/frontend/src/views/learn/ArkDetail.vue`（807 行）
> **Vue3 路由**：`/learn/ark-detail?arkId=...`
> **小程序现状**：learn/index 仅"选塾师"和"组方舟"入口（前面 B1 已加），**方舟详情完全缺**
> **移植目标**：新建独立页 `/root/zishu-mini/pages/ark-detail/`
> **优先级**：P1（方舟管理能力补齐）
> **粒度**：移植类（**核心功能移植**，跳过：踢人/统一结课/学习单内嵌）

---

## 1. 目标

把 Vue3 的"方舟详情"页面（ArkDetail.vue）移植为小程序独立页 `pages/ark-detail/`：
- 显示方舟基本信息（名/塾师/课程/状态/总进度）
- 显示成员列表（队长 + 队员 + 各自进度 + 学习单链接）
- 关键管理操作：
  - 成员可"设我为舟长"（筹建中 + 无舟长 + 自己是塾师时）
  - 塾师/舟长可"编辑三会"（弹窗）
  - 舟长可"完结方舟"（三会全部完成后）
  - 成员可"退出方舟"（队长时不可）
- 错误处理 + 加载态

**简化点**（与 Vue3 区别）：
- ❌ 踢人（敏感操作，留给管理端）
- ❌ 统一结课（舟长操作，逻辑复杂，留给 Vue3 web）
- ❌ 学习单内嵌（vue3 是跳 `/learn/sheet/${userId}`，B3 阶段会移植 `learn-sheet`）
- ❌ 管理员视图（isAdmin 判断，admin 用 web 端）

## 2. Vue3 源页面分析

**核心功能**：
- `arkDetailAPI(arkId)` 拉详情
- `arkSetCaptainAPI({ark_id, [captain_user_id]})` 设舟长
- `arkMeetingsAPI({...})` + `arkGetMeetingsAPI(arkId)` 三会
- `arkCloseAPI({ark_id})` 完结
- `arkLeaveAPI({ark_id})` 退出
- `goLearnSheet(userId)` 跳学习单

**关键交互**：
- 成员卡：用户名 + 进度条 + 章节链接
- 状态：筹建中 / 已成舟 / 已结束
- 角色判断：isCaptain / isTeacher / isAdmin

**API 依赖**（已验证 2026-06-17 18:15 ✅）：
- `GET /api/learn/ark/detail/{ark_id}` — 拉详情
- `POST /api/learn/ark/set_captain` body: `{ark_id, [captain_user_id]}` — 设舟长
- `POST /api/learn/ark/meetings` body: `{ark_id, meet_start, meet_start_time, meet_mid, meet_mid_time, meet_end, meet_end_time}` — 保存三会
- `GET /api/learn/ark/meetings/{ark_id}` — 拉三会
- `POST /api/learn/ark/close` body: `{ark_id}` — 完结
- `POST /api/learn/ark/leave` body: `{ark_id}` — 退出

**Vue3 源已验证**：AmyWu (id=11) JWT + ark_id=4
```bash
curl -H 'token: $JWT' http://127.0.0.1:8008/api/learn/ark/detail/4
# → {ark_id:4, arkname:"测试方舟", stage:"筹建中", members:[2人], total_progress_percent:20.0, ...}
```

## 3. 验收标准

- [ ] `pages/ark-detail/{index.wxml,index.ts,index.wxss,index.json}` 4 个文件齐全
- [ ] `app.json` 已注册 `pages/ark-detail/index`
- [ ] `onLoad(options)` 接收 `arkId` 参数
- [ ] 调 `arkDetailAPI` 加载方舟详情
- [ ] 课程名显示（额外调 `getCourseAPI`）
- [ ] 状态栏：阶段徽章（筹建中/已成舟）+ 已结束 tag
- [ ] 总进度条：百分比
- [ ] 塾师名显示
- [ ] 成员列表：每行 = 用户名 + 队长 ⭐ / 性别 / 进度条 / 学习单按钮
- [ ] 角色判断：
  - 我是舟长 → 显示"完结方舟"按钮
  - 我是塾师 → 显示"编辑三会"按钮
  - 我是成员 + 筹建中 + 无舟长 → 显示"设我为舟长"按钮
  - 我是成员 + 有舟长 + 不是舟长 → 显示"退出方舟"按钮
- [ ] 三会弹窗：6 个字段（3 会议码 + 3 时间），保存 → 调 API
- [ ] 完结方舟：确认弹窗 → 调 API
- [ ] 退出方舟：确认弹窗 → 调 API + 返回上一页
- [ ] 错误处理：toast
- [ ] 加载态
- [ ] 微信开发者工具 console 无 error
- [ ] 从 ark-group 跳 ark-detail（B1 阶段 ark-group 暂跳 learn/index，B2 完成后改 ark-detail）
- [ ] 从 my/my 跳 ark-detail（A2 阶段 my/my 暂跳 learn/index，B2 完成后改 ark-detail）

## 4. 改动清单

**小程序新增**：
- `pages/ark-detail/index.json` — 页面配置
- `pages/ark-detail/index.ts` — ~250 行 Page 逻辑
- `pages/ark-detail/index.wxml` — ~120 行 template
- `pages/ark-detail/index.wxss` — ~300 行样式

**小程序修改**：
- `app.json` — 注册 `pages/ark-detail/index`
- `services/learn/learn.ts` — 新增 5 个 API（`arkDetail` / `arkSetCaptain` / `arkSaveMeetings` / `arkGetMeetings` / `arkClose` / `arkLeave`）
- `pages/ark-group/index.ts` — `onGoDetail` 改跳 ark-detail
- `pages/my/my.ts` — `onArkTap` 改跳 ark-detail

**后端**：无

**三端联动**：无

## 5. 验证步骤

```bash
# 1. 后端 API 烟测（已完成 ✅）
# 2. sandbox 改完代码
# 3. scp 同步
scp /root/zishu-mini/pages/ark-detail/*.{ts,wxml,wxss,json} \
    root@118.25.76.230:/root/zishu-mini/pages/ark-detail/
scp /root/zishu-mini/pages/ark-group/index.ts \
    root@118.25.76.230:/root/zishu-mini/pages/ark-group/
scp /root/zishu-mini/pages/my/my.ts \
    root@118.25.76.230:/root/zishu-mini/pages/my/
scp /root/zishu-mini/services/learn/learn.ts \
    root@118.25.76.230:/root/zishu-mini/services/learn/
scp /root/zishu-mini/app.json \
    root@118.25.76.230:/root/zishu-mini/app.json

# 4. 微信开发者工具打开 /root/zishu-mini
#    - 测试：我的 → 选个方舟 → ark-detail → 看到详情

# 5. git commit
cd /root/zishu-mini
git add pages/ark-detail/ pages/ark-group/ pages/my/ services/learn/ app.json
git commit -m "feat(mini): [spec 004] complete ark-detail 方舟详情独立页"
```

## 6. 状态

- [drafting] **drafting** = 起草中
- [x] **in_progress** = 开发中
- [ ] **done** = 所有验收标准勾完
- [ ] **shipped** = 业务验收通过，移入 archive/

**当前状态**：`in_progress`

**变更历史**：
- 2026-06-17：创建初稿
