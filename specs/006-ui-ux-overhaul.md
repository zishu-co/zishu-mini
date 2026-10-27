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
