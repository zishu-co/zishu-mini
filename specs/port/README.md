# 小程序移植 spec 目录

> **用途**：把"Vue3 → 微信小程序"页面移植工作沉淀为结构化规格，让 AI agent 和开发者对齐"移植什么 / API 怎么用 / 验证什么"。

---

## 📁 目录结构

```
specs/port/
├── README.md           ← 本文件：规范、命名、生命周期
├── template.md         ← 移植类空白模板（复制后改）
│
└── archive/            ← 已 shipped 的移植 spec
    ├── 001-port-finish-course.md
    ├── 002-port-all-ark-into-my.md
    ├── 003-complete-ark-group.md
    ├── 004-complete-ark-detail.md
    └── 005-port-learn-sheet.md
```

> **2026-06-17 历史**：本目录原在 `zishu` 聚合仓库 `specs/miniprogram/`，迁移到 zishu-mini 仓库作为单一事实源。

## 编号规则

| 前缀 | 范围 | 用途 |
|------|------|------|
| `0XX-port-` | 001-099 | 移植类（Vue3 → 小程序） |
| `0XX-complete-` | 001-099 | 移植 + 二次完善（功能增强） |

## 模板

- **`template.md`** — 移植类专用，结构：目标 / Vue3 源 / 验收标准 / 改动清单 / 验证 / 状态

## 工作流（移植一个页面）

```
1. 复制 template.md → archive/00X-port-<kebab-name>.md
2. 填 4 段位（目标/验收/改动/验证）
3. 分派给 agent-miniprogram 子智能体
4. 子智能体按 spec 移植 → sandbox 改代码
5. scp 同步到服务器 /root/zishu-mini
6. 微信开发者工具打开项目 → 手动验证
7. commit 到 dev 分支（zishu-mini 仓库）
8. spec 标 shipped（留在 archive/，加 [shipped] 前缀）
9. 建 pages/<page>/SPEC.md 精简版（引用 archive 完整版）
```

## 移植类 vs 特性类的区别

| 维度 | 移植类（port） | 特性类（feature） |
|------|----------------|------------------|
| 起点 | Vue3 页面已存在 | 从 0 设计 |
| 后端 | 通常不需要改 | 经常要加 API |
| 工作量 | 60% 翻译 + 30% 适配 + 10% 调优 | 100% 设计+实现 |
| 验收重点 | 行为一致 + 微信生态兼容 | 业务价值 |

## Vue3 → 小程序映射速查（细节见 agent-miniprogram skill v1.1.0）

| Vue3 (`/root/zishu/frontend/src/views/`) | 小程序 (`/root/zishu-mini/pages/`) |
|---|---|
| `<template>` | `index.wxml`（v-if→wx:if, v-for→wx:for, @click→bindtap）|
| `<script setup>` | `index.ts`（Page({ data, methods })） |
| `<style scoped>` | `index.wxss`（无 scoped，px→rpx） |
| `axios` | `request({...})` 封装 |
| `localStorage` | `wx.storage` API |
| `vue-router` | `wx.navigateTo({url})` |
| Element Plus | TDesign（`tdesign-miniprogram`）|

**后端**：小程序和 Vue3 前端共用同一个 FastAPI 后端（`http://118.25.76.230:8008`）。

**API 验证约定**：移植前先 `curl` 后端确认 API 可用、响应格式清楚；移植后用 OpenClaw 模拟用户跑一遍核心场景。

## 同步到服务器

```bash
# spec 文件（zishu-mini 仓库）
# 直接 git commit 即可，无需 scp

# 小程序代码（独立仓库 zishu-mini）
scp -r /root/zishu-mini/pages/xxx/ \
    root@118.25.76.230:/root/zishu-mini/pages/
```

## 验证清单（每移植一个页面都要跑）

- [ ] 后端 API 用 curl 烟测（用测试账号 JWT）
- [ ] 小程序代码 scp 同步到服务器
- [ ] 微信开发者工具打开 `/root/zishu-mini`
- [ ] 真机/模拟器至少跑通一个核心场景
- [ ] 无 console error、无网络 4xx/5xx
- [ ] git commit（dev 分支）
- [ ] spec 标 shipped
- [ ] 建 `pages/<page>/SPEC.md` 精简版

## 已完成移植（5 个）

| Spec | commit | 页面 |
|------|--------|------|
| 001-port-finish-course | `16a0e20` | 课程完成 |
| 002-port-all-ark-into-my | `a2e32a5` | 我的方舟（my/my 区块）|
| 003-complete-ark-group | `ad72b1c` | 组方舟独立页 |
| 004-complete-ark-detail | `3988be4` | 方舟详情独立页 |
| 005-port-learn-sheet | `13fb6ad` | 学习单 |

## 相关资源

- 移植 backlog：`zishu` 聚合仓库 `docs/miniprogram-port/migration-backlog.md`（待同步）
- 子智能体 persona：`agent-miniprogram` v1.1.0
- 三端协同规范：`zishu-cross-stack` skill
- 测试账号（4 个 OpenClaw 用）：见 user profile
