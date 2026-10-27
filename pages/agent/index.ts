// @ts-nocheck
// pages/agent/index.ts
// AI 助理聊天页面

import { getMockReply } from '../../services/agent/mock';
import { parseCommand } from '../../services/agent/command-parser';
import { executeCommand } from '../../services/agent/command-executor';
import { Recorder } from '../../services/voice/recorder';
import { Player } from '../../services/voice/player';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  avatar?: string;
  time?: string;
  audioUrl?: string;
}

interface AgentPageData {
  messages: Message[];
  quickPrompts: string[];
  lastMessageId: string;
  inputText: string;
  isLoading: boolean;
  isRecording: boolean;
  recordCancel: boolean;
  recordY: number;
  scrollTop: number;
}

const recorder = new Recorder();
const player = new Player();

Page<AgentPageData, any>({
  data: {
    messages: [],
    quickPrompts: [
      '🤝 找共学搭子',
      '🚢 怎么组2男2女方舟',
      '🎯 制定本周目标',
      '📚 推荐热门课程',
      '🏆 去闯关答题',
    ],
    lastMessageId: '',
    inputText: '',
    isLoading: false,
    isRecording: false,
    recordCancel: false,
    recordY: 0,
    scrollTop: 0,
  },

  onLoad() {
    // 欢迎语
    this.addMessage('assistant', '你好！我是自塾 AI 伴学教练 🤖✨\n你可以直接点下方快捷气泡，或输入想聊的目标、课程、2男2女方舟搭子匹配需求，我还能直接带你去对应页面！');
  },

  onUnload() {
    recorder.stop();
    player.stop();
  },

  // 添加消息
  addMessage(role: 'user' | 'assistant', content: string, audioUrl?: string) {
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const messages = this.data.messages.concat([{
      id: msgId,
      role,
      content,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      audioUrl,
    }]);
    this.setData({
      messages,
      lastMessageId: msgId,
      isLoading: role === 'assistant' ? false : this.data.isLoading,
      scrollTop: messages.length * 1000,
    });
  },

  onQuickPrompt(e: any) {
    const text = e.currentTarget.dataset.prompt;
    if (!text || this.data.isLoading) return;
    this.setData({ inputText: text }, () => {
      this.onSend();
    });
  },

  // 打字发送
  onInput(e: any) {
    this.setData({ inputText: e.detail.value });
  },

  async onSend() {
    const text = this.data.inputText.trim();
    if (!text || this.data.isLoading) return;
    this.setData({ inputText: '', isLoading: true });
    this.addMessage('user', text);

    // 模拟真实思考延迟，确保加载指示器可见
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Mock AI 回复
    const reply = getMockReply(text);
    this.addMessage('assistant', reply.content);

    // 解析并执行 AI 指令
    const command = parseCommand(text) || reply.command;
    if (command) {
      setTimeout(() => {
        executeCommand(command, this);
      }, 650);
    }
  },

  // ==================== 语音相关 ====================

  onVoiceTouchStart(e: any) {
    this.setData({ isRecording: true, recordCancel: false, recordY: e.touches[0].clientY });
    recorder.start();
  },

  onVoiceTouchMove(e: any) {
    const deltaY = e.touches[0].clientY - this.data.recordY;
    this.setData({ recordCancel: deltaY < -80 });
  },

  onVoiceTouchEnd() {
    if (!this.data.isRecording) return;
    this.setData({ isRecording: false });
    if (this.data.recordCancel) {
      recorder.cancel();
      return;
    }
    recorder.stop();
    const tempFilePath = recorder.getTempFilePath();
    if (tempFilePath) {
      // 模拟发送语音消息
      this.addMessage('user', '[语音消息]');
      this.setData({ isLoading: true });
      setTimeout(() => {
        this.addMessage('assistant', '收到了！虽然我暂时无法识别语音，但我能看懂你打的字～');
      }, 800);
    }
  },

  onVoiceCancel() {
    this.setData({ isRecording: false });
    recorder.cancel();
  },

  // 停止语音播放
  stopVoice() {
    player.stop();
  },
});
