// @ts-nocheck
// services/agent/command-executor.ts
// AI 指令执行器

import type { AICommand } from './types';

type AgentPage = any;

const TAB_BAR_PAGES = [
  '/pages/learn/index',
  '/pages/inno/index',
  '/pages/aim/index',
  '/pages/event/index',
  '/pages/my/my',
];

function highlightElement(page: AgentPage, targetPage?: string) {
  if (page && typeof (page as any).triggerEvent === 'function') {
    (page as any).triggerEvent('aihightlight', { page: targetPage });
  }
}

/**
 * 执行 AI 指令
 */
export async function executeCommand(command: AICommand, page: AgentPage): Promise<void> {
  switch (command.type) {
    case 'navigate':
      if (command.params?.url) {
        const url = command.params.url;
        const cleanPath = url.split('?')[0];
        if (TAB_BAR_PAGES.includes(cleanPath)) {
          wx.switchTab({ url: cleanPath });
        } else {
          wx.navigateTo({ url });
        }
      }
      break;

    case 'showModal':
      wx.showModal({
        title: command.params?.title || '提示',
        content: command.params?.content || '',
        showCancel: true,
        confirmText: '好的',
      });
      break;

    case 'highlight':
      // 通知页面高亮某个元素（由页面自行实现）
      highlightElement(page, command.params?.page);
      break;

    case 'none':
    default:
      break;
  }
}
