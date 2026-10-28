# 006-ui-ux-overhaul

> **状态**：done | **最后更新**：2026-10-27
> **负责人**：AI Agent & Stephen | **关联 Spec**：`zishu/specs/active/007-ui-ux-overhaul.md`

---

## 1. 目标

按照**顶级商业级交友与学习小程序**标准，对 `zishu-mini` 微信小程序全部 30+ 页面、公共组件及前后端联动逻辑进行系统重构与体验升级：
1. 彻底消除全部 `.wxml` 非法函数调用与 `Page({})` 无效 `computed`/getter，补齐 `setData` 预计算派生状态；
2. 打通真实后端目标管理（`/api/goals/*`、`/api/users/save_goal`）、智能行动推荐（`/api/actions/recommendations`）与同路人破冰约聊（`/api/users/quick_greet`、`/api/users/confirm_reserve`）接口，告别纯静态 Mock；
3. 打造「2男2女诺亚方舟搭子舱」（`ark-group`/`ark-detail`）、「全塾同路人交友广场」（`all`/`goaltalk`/`mentors`/`supervise`/`followup`）、「沉浸式闯关答题」（`test`/`exam`，根治未交卷泄题 Bug）与「塾值段位成长体系」（`my`/`aim`/`shuzhi`）；
4. 统一 `#a0f` / `#7c3aed` 自塾品牌紫高颜值设计体系、卡片动效、骨架屏/空状态、防连点锁与安全区适配。

---

## 2. 验收标准

- [x] **Slice 1–2（后端 SQLAlchemy 修复 + 交友与智能推荐 API + 个人中心/目标接口联动）**
- [x] **Slice 3–4（方舟 2男2女搭子舱 `ark-group` / `ark-detail` + 学习单 `learn-sheet` / 结课 `finish-course`）**
- [x] **Slice 5–6（全塾同路人交友广场 `all` + 目标约谈 `goaltalk` + 师生 `mentors` / 监督 `supervise` / 结项 `followup`）**
- [x] **Slice 7–8（沉浸式闯关答题 `test` / `exam` + 活动社交圈 `event` / `participants` + 个人中心 `my` / `agent`）**
- [x] **Slice 9–10（全量页面旗舰级深度美化：`course-detail` 分段步进卡与选塾师弹窗、`ark-group` 4席位可视化舱、`exam` 题库搜索大厅、`report`/`report-detail` 成绩单与错题筛选、`inno`/`inno-detail` 里程碑与吸底认领栏、`shuzhi` 段位进度、`editprofile` 实时预览、`changepass` 密码强度计及全量子页面搜索筛选）**
- [x] **Slice 11（全量子页面下拉刷新 `.json` 配置补齐、`supervise` 督学四状态看板筛选与鼓励互动、`mentors` 师生伴学筛选与一键请教、以及微信社交转发分享 `onShareAppMessage` 全覆盖）**
- [x] **零无效 WXML 表达式验证 + 自动化契约与逻辑测试 100% 通过**

---

## 3. 关键路径

详见主仓 [`zishu/specs/active/007-ui-ux-overhaul.md`](../../zishu/specs/active/007-ui-ux-overhaul.md)。

---

## 4. 状态

- [x] drafting
- [x] in_progress
- [x] done
- [ ] shipped

### 2026-10-28：课程详情同塾操作菜单样式适配

- 范围：`pages/course-detail/index.{ts,wxml,wxss}`；将该页面的原生 `wx.showActionSheet` 替换为紫色主题底部面板。
- [x] 保留共学破冰、查看学习单、组方舟三个操作；独立取消按钮、关闭按钮及遮罩关闭。
- [x] 图标与主副标题分层，长昵称/课程名换行；窄屏、横屏可滚动，宽屏最大宽度 560px，预留底部及左右安全区。
- [x] 点击后先清理菜单目标，避免同一面板连续点击重复提交。
- 本地验证：微信原生 WXML/WXSS 编译、`node_modules/.bin/tsc --noEmit`、23 项模板/处理函数/浏览器布局与点击检查、`git diff --check` 均通过。
- 验证边界：浏览器运行微信编译后的真实 WXML 树及页面样式；wx/API 边界使用测试替身，安全区用浏览器模拟。真实微信滚动、真机安全区及后端请求未验收；未上传预览或发布。
- 原始证据：`/Users/stephen/.codex/visualizations/2026/10/28/01a1831d-ca0a-7661-ae2c-ba130386f3cf/course-menu/receipts.json`。

### 2026-10-29：学习中心六宫格配色与弹窗滚动隔离

- 范围：`pages/learn/index.{ts,wxml,wxss}`。
- [x] 六个入口分别采用紫色考试、蓝色成绩、绿色共学、橙色督学、金色预备营、粉色共创背景及对应深色文字。
- [x] 学习中心的选塾师、申报学时、预备营、共创课程四个弹窗统一使用居中弹窗层；标题和操作区固定，中间为有明确高度的原生 `scroll-view`，适配窄屏、横屏和安全区。
- [x] 首节点 `page-meta` 根据四个弹窗的可见状态动态锁定页面滚动；关闭后恢复，保留原滚动位置。遮罩、标题及操作区拦截触摸，内容区可独立滚动。
- [x] 弹窗层级高于底部导航及 AI 悬浮按钮，避免操作被遮挡；预备营标题拆分主副标题，表单标签可换行，提交防连点保持有效。
- 复现：旧版模板/样式在弹窗内容边缘向下滚动时，页面从 450px 移动到 1100px，回归断言失败；原始失败证据保留在 `learning-modals/baseline-red.log`。
- 本地验证：微信原生 WXML/WXSS 编译、TypeScript 检查、35 项模板/逻辑/浏览器布局与滚动检查、此前课程菜单 23 项回归、`git diff --check` 通过。
- 验证边界：浏览器使用真实微信编译后的 WXML 树与源样式，安全区和触摸由 Chromium 模拟，API/wx 为边界测试替身；微信真机滚动及软键盘行为未验收，未上传或发布。
- 原始证据：`/Users/stephen/.codex/visualizations/2026/10/28/01a1831d-ca0a-7661-ae2c-ba130386f3cf/learning-modals/receipts.json`。
