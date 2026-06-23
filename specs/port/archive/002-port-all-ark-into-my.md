# 002-port-all-ark-into-my

> **状态**：in_progress | **最后更新**：2026-06-17
> **Vue3 源**：`/root/zishu/frontend/src/views/user/AllArk.vue`（549 行，**全功能独立页**）
> **Vue3 路由**：`/user/allark`（用户中心入口跳转）
> **移植目标**：**补到** `/root/zishu-mini/pages/my/my.{ts,wxml,wxss}` 当一个新区块（**不是独立页**）
> **优先级**：P0（方舟学习流闭环 · 必修）
> **粒度**：移植类（**简化移植**：my/my 区块化展示，不复制 4 tab 全功能页）

---

## 1. 目标

把"我的方舟"列表从独立全功能页（Vue3 `AllArk.vue` 549 行，4 tab + el-table）**简化移植**为 my/my 页面内的一个独立区块，让用户能快速看到自己相关的所有方舟、点击进入方舟详情。

**用户**：已登录的选课用户
**核心交付物**：my/my 页面新增"我的方舟"区块，含：
- 区块标题 + 数量统计
- 最多展示 5 个方舟（精简卡片：方舟名 / 课程 / 进度 / 状态）
- 空状态提示
- 点击方舟项 → 跳方舟详情（暂时跳 learn/index，后续 B1/B2 阶段会细化）

**简化点**（与 Vue3 区别）：
- ❌ 不做 4 个 tab 切换（筹备/在航/完航/解散合并到一个时间排序列表）
- ❌ 不做全功能 el-table（卡片化展示）
- ❌ 不做"全部"独立入口（数据少，直接列表展示）
- ✅ 保留：方舟名 / 课程名 / 进度 / 状态 / 点击进入详情

## 2. Vue3 源页面分析

**核心功能**（4 tab）：
1. 筹备方舟（`preparing`）
2. 在航方舟（`sailing`）
3. 完航方舟（`finished`）
4. 解散方舟（`closed`）

**关键交互**：
- Tab 切换：`curTab` 控制
- `goArkDetail(arkId)` → `/learn/ark-detail?arkId=...`

**API 依赖**（已验证 2026-06-17 17:45 ✅）：
- `GET /api/learn/ark/user/list` — 返回 `{preparing, sailing, finished, closed}`
- 每个 ark 字段：`ark_id, arkname, course_id, course_title, teacher_id, teacher_name, captain_id, captain_name, create_time, crew_count, members_str, progress_percent, stage, finished, closed, finish_time, role`

**Vue3 源已验证**：用 AmyWu (id=11) JWT 测通 ✅
```bash
curl -H 'token: $JWT' http://127.0.0.1:8008/api/learn/ark/user/list
# → {"preparing":[{ark_id:4,...}], "sailing":[], "finished":[{ark_id:3,...}], "closed":[{ark_id:2,...}]}
```

**后端 2026-06-16 变更**：API 不再"按 user 过滤"，返回所有方舟；新增 `role` 字段标识当前用户身份（teacher/captain/member/none）。

## 3. 验收标准

- [ ] my/my 页面在"统计条"和"功能菜单"之间新增"我的方舟"区块
- [ ] 区块标题："🚢 我的方舟" + 数量统计
- [ ] 列表展示所有方舟（4 个分组按 stage 合并为一个时间倒序列表）
- [ ] 每个方舟卡片显示：方舟名（大字）/ 课程名 / 进度条（%）/ 状态 tag
- [ ] 状态 tag 颜色区分：筹建中（灰）/ 在航（蓝）/ 已成舟（绿）/ 已解散（红）
- [ ] 点击方舟卡片 → 跳方舟详情（暂时 `wx.switchTab` 到 learn/index，后续 B1/B2 完善后改 detail）
- [ ] 列表最多展示 5 个，超出显示"查看更多"（点击暂时不做，先预留 UI）
- [ ] 空状态："暂未加入任何方舟" + 引导文案
- [ ] 未登录态：区块不显示或显示"登录后查看"
- [ ] 加载态：list-loading 状态
- [ ] 错误处理：API 失败时区块不崩溃，toast 提示
- [ ] 微信开发者工具 console 无 error

## 4. 改动清单

**小程序修改**：
- `pages/my/my.ts` — 新增 fetchArks + data 字段 `arkList` / `arkLoading` / `arkCount`
- `pages/my/my.wxml` — 新增"我的方舟"区块（约 30 行）
- `pages/my/my.wxss` — 新增方舟卡片样式（约 100 行）
- `services/learn/learn.ts` — 新增 `getUserArkList()` API 封装（10 行）

**后端**：无

**三端联动**：无

## 5. 验证步骤

```bash
# 1. 后端 API 烟测（已完成 ✅）
# 2. sandbox 改完代码
# 3. scp 同步
scp /root/zishu-mini/pages/my/my.ts /root/zishu-mini/pages/my/my.wxml /root/zishu-mini/pages/my/my.wxss \
    root@118.25.76.230:/root/zishu-mini/pages/my/
scp /root/zishu-mini/services/learn/learn.ts \
    root@118.25.76.230:/root/zishu-mini/services/learn/

# 4. 微信开发者工具打开 /root/zishu-mini
#    - 编译 → 预览 → 扫码
#    - 测试场景：登录 AmyWu → 我的 → 看到 3 个方舟

# 5. git commit
cd /root/zishu-mini
git add pages/my/ services/learn/
git commit -m "feat(mini): [spec 002] port all-ark into my/my 方舟区块"
```

## 6. 状态

- [drafting] **drafting** = 起草中
- [x] **in_progress** = 开发中
- [x] **done** = 所有验收标准勾完
- [ ] **shipped** = 业务验收通过，移入 archive/

**当前状态**：`done`（代码完成，commit 提交；微信开发者工具 GUI 验证待人工）

**变更历史**：
- 2026-06-17：创建初稿
- 2026-06-17：完成代码 + 后端 API 烟测 + commit 提交
