# 🧙‍♂️ 自塾小程序 AI Agent 开发任务清单

> 目标：为自塾小程序打造一个悬浮入口的 AI 语音助理，支持实时语音对话、边说边操控页面。
> 入口：`pages/agent`（非 Hermes，便于切换不同 Agent）
> 优先级：语音 > AI 页面操控

---

## ✅ 已完成

- [x] `agent_todo.md` 创建，定时任务建立

---

## 🎯 核心任务

### 阶段一：悬浮按钮（FAB）

- [ ] `components/ai-assistant-btn/` — 悬浮助手按钮组件
  - [ ] `index.json` — 组件配置
  - [ ] `index.ts` — 组件逻辑（显示/隐藏、角标）
  - [ ] `index.wxml` — 按钮样式（圆形渐变紫色 + 💬图标）
  - [ ] `index.wxss` — 固定定位右下角样式

### 阶段二：Agent 聊天页面

- [ ] `pages/agent/index` — AI 助理聊天页面
  - [ ] `index.json` — 页面配置，标题"AI 助理"
  - [ ] `index.ts` — 页面逻辑（消息列表、发送、加载状态）
  - [ ] `index.wxml` — TDesign `chat-message` 消息列表 + `chat-sender` 输入栏
  - [ ] `index.wxss` — 聊天页面样式

### 阶段三：假数据 Mock 服务

- [ ] `services/agent/mock.ts` — 预设对话 Mock
  - [ ] 用户问候 → AI 欢迎回复
  - [ ] 问课程 → AI 回复课程信息（带 navigate 指令）
  - [ ] 问目标 → AI 回复目标信息
  - [ ] 未知问题 → AI 友好提示

### 阶段四：语音聊天 Demo（优先级高）

- [ ] `services/voice/recorder.ts` — 录音封装（RecorderManager）
- [ ] `services/voice/player.ts` — 语音播放封装（InnerAudioContext）
- [ ] Agent 页面加入按住说话按钮（类似微信语音条）
- [ ] AI 模拟语音回复（文字转语音 Demo，或预录音频）
- [ ] 录音状态 UI（按住/上滑取消）

### 阶段五：AI 页面操控（优先级低，等语音完成后做）

- [ ] `services/agent/command-parser.ts` — AI 指令协议解析
  - [ ] 定义 `AICommand` 类型（navigate / showModal / highlight）
- [ ] `services/agent/command-executor.ts` — 指令执行器
- [ ] `index.ts` 中接入指令解析，AI 回复带 action 时执行

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
├── command-parser.ts       # 阶段五
└── command-executor.ts     # 阶段五

services/voice/
├── recorder.ts
└── player.ts

app.json                    # 需注册 pages/agent
custom-tab-bar/             # 需在每个 tab 页引入 FAB 组件
```

---

## 🔗 依赖关系

```
FAB 组件 ──▶ Agent 页面 ──▶ Mock 服务 ──▶ 语音服务
                 │                        │
                 └──▶ 指令解析器 ◀────────┘
                        （阶段五）
```

---

## 📌 验收标准

1. 任意页面右下角有悬浮 💬 按钮，点击进入 Agent 聊天页
2. 在 Agent 页面打字，AI 回复假数据
3. 按住说话按钮，AI 有语音回复
4. 对 AI 说"帮我看看课程"，AI 跳转到课程详情页
5. 代码推送到 GitHub `zishu-co/zishu-mini` develop 分支
