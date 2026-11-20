/**
 * 反馈 / 共创墙 API 服务
 * 统一走 services/base.ts（双 Token 无感刷新 + `token` header 鉴权）
 */
import base from '../base';

const { get, post, put, delete: del } = base;

/** fetchMyFeedbacks —— 后端路由 /api/feedback/mine */
export const fetchMyFeedbacks = (data?: any): Promise<any> => get('/api/feedback/mine');

/** fetchPublicFeedbacks —— 后端路由 /api/feedback/public */
export const fetchPublicFeedbacks = (data?: any): Promise<any> => get('/api/feedback/public');

/** submitFeedback —— 后端路由 /api/feedback */
export const submitFeedback = (data?: any): Promise<any> => post('/api/feedback', data);

/** uploadFeedbackScreenshot —— 后端路由 /api/feedback/upload_screenshot/ */
export const uploadFeedbackScreenshot = (data?: any): Promise<any> => post('/api/feedback/upload_screenshot/', data);
