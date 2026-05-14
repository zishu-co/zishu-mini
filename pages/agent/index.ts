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
  inputText: string;
  isLoading: boolean;
  isRecording: boolean;
  recordCancel: boolean;
  recordY: number;
}

const recorder = new Recorder();
const player = new Player();

Page<AgentPageData, AgentPageData>({
  data: {
    messages: [],
    inputText: '',
    isLoading: false,
    isRecording: false,
    recordCancel: false,
    recordY: 0,
  },

  onLoad() {
    // 欢迎语
    this.addMessage('assistant', '你好！我是自塾 AI 助理。你可以打字或按住说话，我会尽力帮你。可以问我课程、目标、创新小组等问题，或者让我帮你跳转到不同页面。');
  },

  onUnload() {
    recorder.stop();
    player.stop();
  },

  // 添加消息
  addMessage(role: 'user' | 'assistant', content: string, audioUrl?: string) {
    const messages = this.data.messages.concat([{
      id: Date.now().toString(),
      role,
      content,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      audioUrl,
    }]);
    this.setData({ messages, isLoading: false });
    // 滚动到底
    wx.pageScrollTo({ scrollTop: 99999, duration: 200 });
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

    // 解析 AI 指令
    const command = parseCommand(text);
    if (command) {
      await executeCommand(command, this);
    }

    // Mock AI 回复
    const reply = getMockReply(text);
    this.addMessage('assistant', reply.content);

    // 模拟语音（文字转语音 Demo）
    // 真实场景：接入 TTS API
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
