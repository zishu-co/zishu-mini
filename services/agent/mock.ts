// @ts-nocheck
// services/agent/mock.ts
// AI 助理假数据 Mock 服务

import type { MockReply } from './types';

/** 预设问答规则 */
const rules: Array<{ keywords: string[]; reply: MockReply }> = [
  {
    keywords: ['课程', '学习', '选课'],
    reply: {
      content: '你现在已选修 3 门课程：\n• 产品创新思维\n• Python 数据分析\n• 商业模式设计\n\n要查看全部课程吗？我可以帮你跳转过去 🎯',
      command: { type: 'navigate', params: { url: '/pages/learn/index' } },
    },
  },
  {
    keywords: ['目标', 'goal', 'aim'],
    reply: {
      content: '你当前设置了 2 个目标：\n1. 完成产品创新课程 🎯\n2. 每周读一本书\n\n要我帮你查看目标详情吗？',
      command: { type: 'navigate', params: { url: '/pages/aim/index' } },
    },
  },
  {
    keywords: ['创新', '小组', 'inno'],
    reply: {
      content: '自塾创新平台目前有 5 个活跃小组：\n🚀 人工智能创新组\n💡 产品设计组\n📈 商业模式组\n🌱 可持续发展组\n🎨 数字创意组\n\n你对哪个感兴趣？我可以帮你跳转 🚀',
      command: { type: 'navigate', params: { url: '/pages/inno/index' } },
    },
  },
  {
    keywords: ['活动', 'event'],
    reply: {
      content: '最近有 2 个热门活动：\n📅 产品设计工作坊（本周六）\n📅 AI 创新沙龙（下周三）\n\n要了解详情吗？',
      command: { type: 'navigate', params: { url: '/pages/event/index' } },
    },
  },
  {
    keywords: ['个人中心', '我的', '用户'],
    reply: {
      content: '好的，跳转到个人中心 👤',
      command: { type: 'navigate', params: { url: '/pages/my/my' } },
    },
  },
  {
    keywords: ['你好', 'hi', 'hello', '嗨'],
    reply: {
      content: '你好！我是自塾 AI 助理 💬\n\n我可以帮你：\n• 回答课程、目标、创新小组相关问题\n• 跳转到不同页面\n• 提供学习建议\n\n有什么可以帮你的吗？',
    },
  },
  {
    keywords: ['帮助', 'help', '怎么用'],
    reply: {
      content: '使用指南 📖\n\n• 直接打字问我问题\n• 按住 🎤 按钮说话（类似微信语音）\n• 说帮我看看课程等指令，我会帮你跳转\n\n试试对我说：\n「帮我看看课程」\n「今天有什么目标」\n「创新小组有哪些」',
    },
  },
];

/** 兜底回复 */
const fallbackReply: MockReply = {
  content: '抱歉，我暂时没有理解你的问题 😅\n\n你可以试着问：\n• 「课程」— 查看选课情况\n• 「目标」— 查看学习目标\n• 「创新小组」— 浏览创新平台\n• 「帮助」— 查看使用指南\n\n或者直接说「帮我跳转到 xxx」，我会帮你！',
};

/**
 * 根据用户输入获取 Mock 回复
 */
export function getMockReply(userInput: string): MockReply {
  const lower = userInput.toLowerCase();
  for (const rule of rules) {
    if (rule.keywords.some(k => lower.includes(k))) {
      return rule.reply;
    }
  }
  return fallbackReply;
}
