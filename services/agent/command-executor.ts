// @ts-nocheck
// services/agent/command-executor.ts
// AI 指令执行器

import type { AICommand } from './types';

type AgentPage = any;

/**
 * 执行 AI 指令
 */
export async function executeCommand(command: AICommand, page: AgentPage): Promise<void> {
  switch (command.type) {
    case 'navigate':
      if (command.params?.url) {
        wx.navigateTo({ url: command.params.url });
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
      page.triggerEvent('aihightlight', { page: command.params?.page });
      break;

    case 'none':
    default:
      break;
  }
}
