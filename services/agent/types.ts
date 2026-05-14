// @ts-nocheck
// services/agent/types.ts
// AI Agent 类型定义

/** AI 指令类型 */
export type AICommandType = 'navigate' | 'showModal' | 'highlight' | 'none';

/** AI 指令 */
export interface AICommand {
  type: AICommandType;
  params?: {
    url?: string;        // navigate 目标页面
    title?: string;      // showModal 标题
    content?: string;    // showModal 内容
    page?: string;       // highlight 目标页面
    element?: string;    // highlight 元素选择器
  };
}

/** 聊天消息 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time?: string;
  audioUrl?: string;
}

/** Mock 回复 */
export interface MockReply {
  content: string;
  command?: AICommand;
}
