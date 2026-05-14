// @ts-nocheck
// services/agent/command-parser.ts
// AI 指令协议解析

import type { AICommand } from './types';

/** 导航关键词 → 页面路径映射 */
const NAV_MAP: Record<string, string> = {
  '课程': '/pages/learn/index',
  '学习': '/pages/learn/index',
  '选课': '/pages/learn/index',
  '目标': '/pages/aim/index',
  '创新': '/pages/inno/index',
  '小组': '/pages/inno/index',
  '活动': '/pages/event/index',
  '我的': '/pages/my/my',
  '个人中心': '/pages/my/my',
  '文章': '/pages/article/index',
  '考试': '/pages/exam/index',
};

/**
 * 从用户输入中解析 AI 指令
 */
export function parseCommand(input: string): AICommand | null {
  const lower = input.toLowerCase();

  // 导航指令
  if (lower.includes('看看') || lower.includes('查看') || lower.includes('跳转') || lower.includes('去') || lower.includes('打开')) {
    for (const [keyword, url] of Object.entries(NAV_MAP)) {
      if (lower.includes(keyword)) {
        return { type: 'navigate', params: { url } };
      }
    }
  }

  // 弹窗指令（显式询问）
  if (lower.includes('告诉我') || lower.includes('说说看')) {
    return { type: 'showModal', params: { title: '提示', content: input } };
  }

  // 高亮指令（强调某个区域）
  if (lower.includes('高亮') || lower.includes('标记')) {
    return { type: 'highlight', params: { page: 'learn' } };
  }

  return null;
}
