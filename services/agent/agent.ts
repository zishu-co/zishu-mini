/**
 * AI 助理 API 服务
 * 统一走 services/base.ts（双 Token 无感刷新 + `token` header 鉴权）
 */
import base from '../base';

const { get, post, put, delete: del } = base;

/** aiCoachReply —— 后端路由 /api/users/ai_coach_reply */
export const aiCoachReply = (data?: any): Promise<any> => post('/api/users/ai_coach_reply', data);

/** planActions —— 后端路由 /api/coze/plan_actions */
export const planActions = (data?: any): Promise<any> => post('/api/coze/plan_actions', data);

/** saveConversationId —— 后端路由 /api/coze/save_conversation_id */
export const saveConversationId = (data?: any): Promise<any> => post('/api/coze/save_conversation_id', data);
