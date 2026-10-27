// @ts-nocheck
// pages/agent/index.ts
// AI 助理聊天页面

import { getMockReply } from '../../services/agent/mock';
import { parseCommand } from '../../services/agent/command-parser';
import { executeCommand } from '../../services/agent/command-executor';
import { Recorder } from '../../services/voice/recorder';
import { Player } from '../../services/voice/player';
import http from '../../services/base';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  avatar?: string;
  time?: string;
  audioUrl?: string;
  actionLabel?: string;
  actionUrl?: string;
  actionIsTab?: boolean;
}

function resolveQuickAction(text: string): { actionLabel?: string; actionUrl?: string; actionIsTab?: boolean } {
  const t = String(text || '');
  if (t.includes('方舟') || t.includes('2男2女')) {
    return { actionLabel: '🚢 进入诺亚方舟搭子舱', actionUrl: '/pages/ark-group/index', actionIsTab: false };
  }
  if (t.includes('搭子') || t.includes('同路人') || t.includes('交友')) {
    return { actionLabel: '🤝 前往全塾同路人交友广场', actionUrl: '/pages/all/index', actionIsTab: false };
  }
  if (t.includes('目标')) {
    return { actionLabel: '🎯 打开以终为始目标页', actionUrl: '/pages/aim/index', actionIsTab: true };
  }
  if (t.includes('闯关') || t.includes('答题') || t.includes('测验')) {
    return { actionLabel: '🏆 前往闯关题库大厅', actionUrl: '/pages/exam/index', actionIsTab: false };
  }
  if (t.includes('课程') || t.includes('学习')) {
    return { actionLabel: '📚 前往共学选课中心', actionUrl: '/pages/learn/index', actionIsTab: true };
  }
  return {};
}

interface AgentPageData {
  messages: Message[];
  quickPrompts: string[];
  suggestedGoal: string;
  adoptingGoal: boolean;
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
    suggestedGoal: '',
    adoptingGoal: false,
    lastMessageId: '',
    inputText: '',
    isLoading: false,
    isRecording: false,
    recordCancel: false,
    recordY: 0,
    scrollTop: 0,
  },

  onLoad() {
    this.initWelcome();
  },

  initWelcome() {
    this.setData({ messages: [], suggestedGoal: '' }, () => {
      this.addMessage(
        'assistant',
        '你好！我是自塾 AI 伴学教练 🤖✨\n你可以直接点下方快捷气泡，或输入想聊的目标、课程、2男2女方舟搭子匹配需求，我还能直接带你去对应页面！',
        undefined,
        { actionLabel: '🤝 逛逛同路人交友广场', actionUrl: '/pages/all/index', actionIsTab: false }
      );
    });
  },

  onShareAppMessage() {
    return {
      title: '自塾 AI 伴学教练 🤖 定制学习目标 · 匹配 2男2女方舟共学搭子',
      path: '/pages/agent/index',
    };
  },

  onClearChat() {
    wx.showModal({
      title: '重置对话',
      content: '确定清空当前对话记录并重新开始吗？',
      confirmColor: '#7c3aed',
      success: (res) => {
        if (res.confirm) {
          this.initWelcome();
          wx.showToast({ title: '已重置对话', icon: 'none' });
        }
      },
    });
  },

  onCopyMessage(e: any) {
    const content = e.currentTarget.dataset.content;
    if (!content) return;
    wx.setClipboardData({
      data: String(content),
      success: () => {
        wx.showToast({ title: '📋 已复制消息内容', icon: 'none' });
      },
    });
  },

  onBubbleAction(e: any) {
    const { url, istab } = e.currentTarget.dataset;
    if (!url) return;
    if (istab) {
      wx.switchTab({ url });
    } else {
      wx.navigateTo({ url });
    }
  },

  onUnload() {
    recorder.stop();
    player.stop();
  },

  // 添加消息
  addMessage(
    role: 'user' | 'assistant',
    content: string,
    audioUrl?: string,
    extra?: { actionLabel?: string; actionUrl?: string; actionIsTab?: boolean }
  ) {
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const messages = this.data.messages.concat([{
      id: msgId,
      role,
      content,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      audioUrl,
      ...(extra || {}),
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

    const storedUser = wx.getStorageSync('userInfo') || {};
    const userId = Number(wx.getStorageSync('userId') || storedUser.userId || storedUser.id || 0);

    let replyContent = '';
    let suggestedGoal = '';
    let remoteCommand: any = null;

    try {
      const res: any = await http.post('/api/users/ai_coach_reply', {
        prompt: text,
        user_id: userId || undefined,
      });
      if (res && res.reply) {
        replyContent = res.reply;
        suggestedGoal = res.suggested_goal || '';
        remoteCommand = res.command || null;
      }
    } catch {
      // 离线或后端未升级时平滑回退本地智能规则
    }

    if (!replyContent) {
      await new Promise((resolve) => setTimeout(resolve, 280));
      const fallback = getMockReply(text);
      replyContent = fallback.content;
      remoteCommand = fallback.command;
      if (text.includes('目标') || text.length >= 8) {
        suggestedGoal = text.includes('目标')
          ? '30天内完成1门核心课程并结识3位共学搭子组成方舟通关'
          : text;
      }
    }

    const quickAction = resolveQuickAction(text + ' ' + replyContent);
    this.addMessage('assistant', replyContent, undefined, quickAction);
    if (suggestedGoal) {
      this.setData({ suggestedGoal });
    }

    const command = parseCommand(text) || remoteCommand;
    if (command) {
      setTimeout(() => {
        executeCommand(command, this);
      }, 650);
    }
  },

  async onAdoptGoal() {
    const goalText = (this.data.suggestedGoal || '').trim();
    if (!goalText || this.data.adoptingGoal) return;
    this.setData({ adoptingGoal: true });
    const now = new Date();
    const dl = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const deadlineStr = `${dl.getFullYear()}-${String(dl.getMonth() + 1).padStart(2, '0')}-${String(dl.getDate()).padStart(2, '0')}`;
    const startStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const storedUser = wx.getStorageSync('userInfo') || {};
    const userId = Number(wx.getStorageSync('userId') || storedUser.userId || storedUser.id || 0);

    const newGoalObj: any = {
      id: Date.now(),
      user_id: userId || 1001,
      content: goalText,
      start_time: startStr,
      deadline: deadlineStr,
      process: 1,
      review: '由 AI 伴学教练协同制定，开启共学冲刺！',
    };

    try {
      if (userId) {
        const res: any = await http.requestWithRefresh({
          url: '/api/users/save_goal',
          method: 'POST',
          data: {
            goal_id: 0,
            content: goalText,
            deadline: deadlineStr,
            process: 1,
            review: newGoalObj.review,
            status: 'active',
          },
        });
        if (res && res.goal_id) {
          newGoalObj.id = res.goal_id;
        }
      }
    } catch {}

    wx.setStorageSync('savedGoal', newGoalObj);
    this.setData({ adoptingGoal: false, suggestedGoal: '' });
    wx.showToast({ title: '🎯 已设为当前目标！', icon: 'success' });
    setTimeout(() => {
      wx.switchTab({ url: '/pages/aim/index' });
    }, 900);
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
