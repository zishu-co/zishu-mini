# 自塾小程序 specs 目录

> **简易版 SDD（Specification-Driven Development）**：把"功能/任务/页面/移植"沉淀为结构化规格，让 AI agent 和开发者能快速对齐"做什么 / 验收什么 / 改了什么"。

---

## 📁 目录结构

```
specs/
├── README.md                 ← 本文件：规范、命名、生命周期
├── template.md               ← 通用空白模板（复制后改）
├── NOTES模板.md              ← 笔记/记录模板
│
├── pages/                    ← 页面级 spec（镜像 pages/ 结构）
│   ├── index/SPEC.md         ← 首页
│   ├── login/SPEC.md         ← 登录
│   ├── my/SPEC.md            ← 我的（含"我的方舟"区块）
│   ├── finish-course/SPEC.md ← 课程完成（移植）
│   ├── ark-group/SPEC.md     ← 组方舟（移植）
│   ├── ark-detail/SPEC.md    ← 方舟详情（移植）
│   └── learn-sheet/SPEC.md   ← 学习单（移植）
│
├── port/                     ← 移植类 spec（Vue3 → 小程序）
│   ├── README.md             ← 移植流程规范
│   ├── template.md           ← 移植类空白模板
│   └── archive/              ← 已完成/已 shipped 的移植 spec
│       ├── 001-port-finish-course.md
│       ├── 002-port-all-ark-into-my.md
│       ├── 003-complete-ark-group.md
│       ├── 004-complete-ark-detail.md
│       └── 005-port-learn-sheet.md
│
├── guides/                   ← 项目规范（Git/SDD/代码风格）
│   ├── README.md
│   ├── git.md
│   ├── sdd.md
│   └── code-style.md
│
├── architecture/             ← 技术架构
│   ├── README.md
│   ├── api.md
│   ├── design.md
│   └── structure.md
│
├── components/               ← 组件规范
│   ├── README.md
│   ├── library.md
│   └── development.md
│
├── workflow/                 ← 流程规范（分支/PR/发布/预览）
│   ├── README.md
│   ├── branch.md
│   ├── pr-review.md
│   ├── release.md
│   └── preview.md
│
└── PRODUCT-SPEC.md           ← 产品规格总览（页面清单 + 功能模块）
```

---

## 📝 命名规范

| 类型 | 命名格式 | 位置 | 示例 |
|------|---------|------|------|
| 页面级 spec | `SPEC.md` | `pages/<page-name>/` | `pages/my/SPEC.md` |
| 移植类 spec | `00X-port-<kebab-name>.md` | `port/archive/` | `port/archive/001-port-finish-course.md` |
| 规范文档 | `<topic>.md` | `guides/` / `architecture/` / `workflow/` | `guides/sdd.md` |

---

## 🎯 4 段位（每个 SPEC 必填）

直接复制 `template.md` 填 4 段即可：

| 段 | 作用 | 必填 |
|---|------|------|
| **1. 目标** | 1-3 句话：解决什么问题、谁受益、成功的标志 | ✅ |
| **2. 验收标准** | checkbox 列表：什么算"做完" | ✅ |
| **3. 关键路径**（页面级） / **改动清单**（特性级） | 文件路径 + API + 后端路由 | ✅ |
| **4. 状态** | `drafting` / `in_progress` / `done` / `shipped` + commit hash + 变更历史 | ✅ |

**为什么是 4 段而不是更多**：
- 完整 SDD（OpenAPI/TypeSpec）成本太高，10-50 倍工作量
- 我们要的是"AI agent 5 分钟能读完的上下文"，不是"机器可验证的契约"
- 真要接口契约，加 `swagger` URL 或后端 OpenAPI 链接即可

---

## 🔄 生命周期

```
drafting（起草中）
  ↓ 作者 review
in_progress（开发中，git 提交带 spec 编号）
  ↓ 测试 + 上线
done（功能完成，待人工验证）
  ↓ 业务验收通过
shipped（已上线，移入 archive/，加 [shipped] 前缀）
```

**转移规则**：
- `drafting → in_progress`：spec 4 段都填完，开始改代码
- `in_progress → done`：所有验收 checkbox 勾完
- `done → shipped`：移入 `archive/`，加 `[shipped]` 前缀
- 任意阶段变更：直接改 spec 文件，commit 记录在 spec 内部"变更历史"

**移植类 spec 特殊规则**（`port/`）：
- 移植类 spec 起点是 Vue3 页面已存在（不是从 0 设计）
- 完成后**直接进** `port/archive/`，跳过 `pages/<name>/` 的 shipped 流程
- 移植完成后在 `pages/<name>/SPEC.md` 写**精简版**（4 段位），引用完整 spec 在 `port/archive/`

---

## 📋 pages/ 子目录清单（镜像 `pages/`）

| 子目录 | 镜像 `pages/` | 路由 | 状态 |
|--------|--------------|------|------|
| `pages/index/` | `pages/index/index` | TabBar 学习 | ✅ 已有 spec |
| `pages/login/` | `pages/login/login` | 登录 | ✅ 已有 spec |
| `pages/my/` | `pages/my/my` | TabBar 我的 | ✅ 已有 spec（含"我的方舟"）|
| `pages/finish-course/` | `pages/finish-course/index` | 课程完成 | ✅ 移植完成 |
| `pages/ark-group/` | `pages/ark-group/index` | 组方舟 | ✅ 移植完成 |
| `pages/ark-detail/` | `pages/ark-detail/index` | 方舟详情 | ✅ 移植完成 |
| `pages/learn-sheet/` | `pages/learn-sheet/index` | 学习单 | ✅ 移植完成 |
| **待补** | `pages/aim/` `pages/inno/` `pages/event/` | 目标/创新/活动 | ⏸️ |
| **待补** | `pages/agent/` `pages/course-detail/` 等 | AI 助理/课程详情等 | ⏸️ |

---

## 🤖 AI Agent 使用规范

1. **接到任务先看 `pages/`** —— 找有没有对应页面的 spec
2. **接到移植任务看 `port/`** —— 找有没有对应的移植 spec（含完整 Vue3 源分析）
3. **有 spec** → 按 spec 的"验收标准"和"关键路径"做，不偏离
4. **没 spec** → 提醒用户："是否需要先建一个 spec？避免散落 md"
5. **改 spec 也要 commit** —— spec 是单一事实源（single source of truth）

**关键路径速查**（agent 找 spec）：
- 任务说"改首页" → `specs/pages/index/SPEC.md`
- 任务说"改方舟详情" → `specs/pages/ark-detail/SPEC.md`（看精简版）+ `specs/port/archive/004-complete-ark-detail.md`（看完整版）
- 任务说"加新功能" → `specs/pages/` 找对应页面，或新建
- 任务说"从 Vue3 移植" → 复制 `specs/port/template.md` 建新 spec

---

## 🔗 移植流程（Vue3 → 小程序）

> 详细规范：[`port/README.md`](./port/README.md)

1. **分析 Vue3 源** → 抽核心功能 + API
2. **写 spec** → 复制 `port/template.md`，4 段位填完
3. **后端 API 烟测** → curl + JWT 验证响应结构
4. **分派子智能体** → `agent-miniprogram` v1.1.0
5. **实施** → 4 文件（wxml/wxss/ts/json）+ API 封装
6. **scp 同步** → sandbox → 服务器
7. **git commit** → dev 分支
8. **移入 archive/** → spec 加 [shipped] 前缀
9. **建精简 page spec** → `pages/<name>/SPEC.md` 引用 archive 完整版

---

## 📊 移植进度（2026-06-17 截至）

| 移植 spec | commit | 状态 |
|----------|--------|------|
| 001-port-finish-course | `16a0e20` | ✅ shipped |
| 002-port-all-ark-into-my | `a2e32a5` | ✅ shipped |
| 003-complete-ark-group | `ad72b1c` | ✅ shipped |
| 004-complete-ark-detail | `3988be4` | ✅ shipped |
| 005-port-learn-sheet | `13fb6ad` | ✅ shipped |

**方舟学习流闭环**：5 个新页面 + 1 个 my/my 区块全部移植完成 ✅

---

## 🔗 与其他文件的关系

| 旧位置 | 新位置 |
|--------|--------|
| 旧 `docs/0.项目规范/` | `specs/guides/` |
| 旧 `docs/1.产品规格/` | `specs/pages/`（页面级）+ `specs/PRODUCT-SPEC.md`（总览）+ `specs/template.md`（模板）|
| 旧 `docs/2.技术架构/` | `specs/architecture/` |
| 旧 `docs/3.组件规范/` | `specs/components/` |
| 旧 `docs/4.流程规范/` | `specs/workflow/` |
| 旧 `docs/PREVIEW.md` | `specs/workflow/preview.md` |
| 旧 `docs/README-LIGHT.md` | ❌ 删除（重复，已被 `guides/sdd.md` 涵盖）|

**移植类 spec 跨仓库追踪**（2026-06-17 迁移）：
- 旧：`zishu` 聚合仓库 `specs/miniprogram/`（已删除，commit 待提交）
- 新：本仓库 `specs/port/`（唯一事实源）

---

## 🛠️ 模板速查

| 场景 | 模板 | 位置 |
|------|------|------|
| 新页面 | `template.md` | `specs/template.md` |
| 移植类 | `template.md`（移植版） | `specs/port/template.md` |
| 笔记/记录 | `NOTES模板.md` | `specs/NOTES模板.md` |
