# 🧙‍♂️ 自塾小程序 AI Agent 开发任务清单

> 目标：为自塾小程序打造一个悬浮入口的 AI 语音助理，支持实时语音对话、边说边操控页面。
> 入口：`pages/agent`（非 Hermes，便于切换不同 Agent）
> 优先级：语音 > AI 页面操控

---

## ✅ 已完成

- [x] `agent_todo.md` 创建，定时任务建立
- [x] 阶段一：悬浮按钮（FAB）- `components/ai-assistant-btn/`
- [x] 阶段二：Agent 聊天页面 - `pages/agent/index`
- [x] 阶段三：假数据 Mock 服务 - `services/agent/mock.ts`
- [x] 阶段四：语音聊天 Demo - `services/voice/recorder.ts` + `player.ts`
- [x] 阶段五：AI 页面操控 - `services/agent/command-parser.ts` + `command-executor.ts`

---

## 🎯 核心任务

### 阶段一：悬浮按钮（FAB）

- [x] `components/ai-assistant-btn/` — 悬浮助手按钮组件
  - [x] `index.json` — 组件配置
  - [x] `index.ts` — 组件逻辑（显示/隐藏、角标）
  - [x] `index.wxml` — 按钮样式（圆形渐变紫色 + 💬图标）
  - [x] `index.wxss` — 固定定位右下角样式

### 阶段二：Agent 聊天页面

- [x] `pages/agent/index` — AI 助理聊天页面
  - [x] `index.json` — 页面配置，标题AI 助理
  - [x] `index.ts` — 页面逻辑（消息列表、发送、加载状态）
  - [x] `index.wxml` — 消息气泡列表 + 语音输入栏
  - [x] `index.wxss` — 聊天页面样式

### 阶段三：假数据 Mock 服务

- [x] `services/agent/mock.ts` — 预设对话 Mock
  - [x] 用户问候 → AI 欢迎回复
  - [x] 问课程 → AI 回复课程信息（带 navigate 指令）
  - [x] 问目标 → AI 回复目标信息
  - [x] 未知问题 → AI 友好提示

### 阶段四：语音聊天 Demo（优先级高）

- [x] `services/voice/recorder.ts` — 录音封装（RecorderManager）
- [x] `services/voice/player.ts` — 语音播放封装（InnerAudioContext）
- [x] Agent 页面加入按住说话按钮（类似微信语音条）
- [x] AI 模拟语音回复（文字转语音 Demo，或预录音频）
- [x] 录音状态 UI（按住/上滑取消）

### 阶段五：AI 页面操控（优先级低，等语音完成后做）

- [x] `services/agent/command-parser.ts` — AI 指令协议解析
  - [x] 定义 `AICommand` 类型（navigate / showModal / highlight）
- [x] `services/agent/command-executor.ts` — 指令执行器
- [x] `index.ts` 中接入指令解析，AI 回复带 action 时执行

---

## 📁 完整文件清单

```
components/ai-assistant-btn/
├── index.json
├── index.ts
├── index.wxml
└── index.wxss

pages/agent/
├── index.json
├── index.ts
├── index.wxml
└── index.wxss

services/agent/
├── mock.ts
├── types.ts
├── command-parser.ts
└── command-executor.ts

services/voice/
├── recorder.ts
└── player.ts

app.json                    # 已注册 pages/agent
custom-tab-bar/             # 已引用 FAB 组件
```

---

## 🔗 依赖关系

```
FAB 组件 ──▶ Agent 页面 ──▶ Mock 服务 ──▶ 语音服务
                 │                        │
                 └──▶ 指令解析器 ◀────────┘
```

---

## 📌 验收标准

1. [x] 任意页面右下角有悬浮 💬 按钮，点击进入 Agent 聊天页
2. [x] 在 Agent 页面打字，AI 回复假数据
3. [x] 按住说话按钮，AI 有语音回复（模拟）
4. [x] 对 AI 说帮我看看课程，AI 跳转到课程详情页
5. [x] 代码推送到 GitHub `zishu-co/zishu-mini` dev 分支

---

## 📝 备注

- 语音功能 Demo：使用模拟输入而非真实录音，真实录音需配合语音识别 API
- Agent 页面目前使用 Mock 数据，真实 AI 对接需后续接入 LLM API
- FAB 组件已添加到所有 tabBar 页面（通过 custom-tab-bar）
- commit: `ac65ac00` feat(agent): 完成 AI 助理悬浮入口全套功能
- 分支: `dev`（而非 develop）
