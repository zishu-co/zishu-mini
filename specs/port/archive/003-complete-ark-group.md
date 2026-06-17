# 003-complete-ark-group

> **状态**：in_progress | **最后更新**：2026-06-17
> **Vue3 源**：`/root/zishu/frontend/src/views/learn/ArkGroup.vue`（425 行）
> **Vue3 路由**：`/learn/ark-group?courseId=...`
> **小程序现状**：learn/index 仅含"选塾师"功能，**完全缺"组方舟"流程**
> **移植目标**：新建独立页 `/root/zishu-mini/pages/ark-group/{index.wxml,index.ts,index.wxss,index.json}`
> **优先级**：P1（方舟管理能力补齐）
> **粒度**：移植类（独立页，比 learn/index 解耦）

---

## 1. 目标

把 Vue3 的"组方舟"页面（ArkGroup.vue）移植为小程序独立页 `pages/ark-group/`：
- 拉取指定课程下所有塾师的方舟列表
- 用户可加入现有方舟（按性别限 2 男 / 2 女）
- 塾师本人可一键创建方舟
- 跳方舟详情（暂时跳回 learn/index，后续 B2 阶段会跳 detail 页）
- 在 learn/index 课程卡片上加"加入方舟"入口

## 2. Vue3 源页面分析

**核心功能**：
- `onMounted` 调 `arkListByTeacherAPI(courseId)` + `arkMyAPI()`
- `canJoin(ark, gender)` 判断：未关闭/未完航 + 男 < 2 或 女 < 2
- `onJoinArk(ark)` 调 `arkJoinAPI({ark_id})` 加入
- `onCreateArk()` 调 `arkCreateAPI({course_id})` 创建
- `goDetail(arkId)` 跳 `/course/ark-detail?arkId=...`

**关键交互**：
- 教师卡：塾师名 + 状态徽章（已成舟/待成舟）+ 操作按钮（加入/创建/查看详情）
- 成员名单：横向铺开（用户名 + 性别标签 + 队长 ⭐）
- 性别限制：男 2 女 2

**API 依赖**（已验证 2026-06-17 18:00 ✅）：
- `GET /api/learn/ark/list_by_teacher?course_id=N` — 拉该课程所有塾师的方舟列表
- `GET /api/learn/ark/my` — 拉我已加入的方舟（用于标记）
- `POST /api/learn/ark/join` body: `{ark_id}` — 加入方舟
- `POST /api/learn/ark/create` body: `{course_id}` — 创建方舟

**Vue3 源已验证**：AmyWu (id=11) JWT + course_id=1
```bash
curl -H 'token: $JWT' 'http://127.0.0.1:8008/api/learn/ark/list_by_teacher?course_id=1'
# → [{teacher_id:6, teacher_name:"测试", ark_id:4, arkname:"测试方舟", stage:"筹建中", male_count:1, female_count:0, members:[...], closed:0, finished:0}]
```

## 3. 验收标准

- [ ] `pages/ark-group/{index.wxml,index.ts,index.wxss,index.json}` 4 个文件齐全
- [ ] `app.json` 已注册 `pages/ark-group/index`
- [ ] `onLoad(options)` 接收 `courseId` 参数
- [ ] 调 `arkListByTeacherAPI` + `arkMyAPI` 加载数据
- [ ] 教师卡：塾师名 + 状态徽章（已成舟 = 绿 / 待成舟 = 紫 / 已结束 = 灰）
- [ ] 教师卡操作：
  - 有方舟 + 有空位 → "加入方舟" 按钮
  - 有方舟 + 已满 → "名额已满" 文字
  - 有方舟 + 已结束/关闭 → "方舟已结束" 文字
  - 有方舟 + "查看详情" 链接
  - 无方舟 + 当前用户是该塾师 → "创建方舟" 按钮
  - 无方舟 + 当前用户不是该塾师 → "该塾师尚未创建方舟" 文字
- [ ] 成员名单：性别徽章（男=蓝 / 女=粉）+ 队长 ⭐
- [ ] `arkJoinAPI` 成功 → toast + 刷新列表
- [ ] `arkCreateAPI` 成功 → toast + 刷新列表
- [ ] 性别限制：加入按钮按当前用户性别判断
- [ ] 错误处理：API 失败 toast
- [ ] 空状态：暂无塾师
- [ ] 微信开发者工具 console 无 error
- [ ] learn/index "我的选课"卡片加"加入方舟"按钮（数据-ark-course-id 传参）
- [ ] learn/index 跳转：`wx.navigateTo({url: '/pages/ark-group/index?courseId=' + courseId})`

## 4. 改动清单

**小程序新增**：
- `pages/ark-group/index.json` — 页面配置
- `pages/ark-group/index.ts` — ~180 行 Page 逻辑
- `pages/ark-group/index.wxml` — ~100 行 template
- `pages/ark-group/index.wxss` — ~250 行样式

**小程序修改**：
- `app.json` — 注册 `pages/ark-group/index`
- `services/learn/learn.ts` — 新增 4 个 API（`arkListByTeacher` / `arkMy` / `arkJoin` / `arkCreate`）
- `pages/learn/index.wxml` — "我的选课"卡片加"加入方舟"按钮
- `pages/learn/index.ts` — `onJoinArk` 跳转方法

**后端**：无

**三端联动**：无

## 5. 验证步骤

```bash
# 1. 后端 API 烟测（已完成 ✅）
# 2. sandbox 改完代码
# 3. scp 同步
scp /root/zishu-mini/pages/ark-group/*.{ts,wxml,wxss,json} \
    root@118.25.76.230:/root/zishu-mini/pages/ark-group/
scp /root/zishu-mini/pages/learn/index.{ts,wxml} \
    root@118.25.76.230:/root/zishu-mini/pages/learn/
scp /root/zishu-mini/services/learn/learn.ts \
    root@118.25.76.230:/root/zishu-mini/services/learn/
scp /root/zishu-mini/app.json \
    root@118.25.76.230:/root/zishu-mini/app.json

# 4. 微信开发者工具打开 /root/zishu-mini
#    - 测试：选课后 → 我的选课卡片 → 加入方舟 → ark-group 页面

# 5. git commit
cd /root/zishu-mini
git add pages/ark-group/ pages/learn/ services/learn/ app.json
git commit -m "feat(mini): [spec 003] complete ark-group 独立页 + 入口"
```

## 6. 状态

- [drafting] **drafting** = 起草中
- [x] **in_progress** = 开发中
- [ ] **done** = 所有验收标准勾完
- [ ] **shipped** = 业务验收通过，移入 archive/

**当前状态**：`in_progress`

**变更历史**：
- 2026-06-17：创建初稿
