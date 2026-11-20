/**
 * 活动 / 社区 API 服务
 * 统一走 services/base.ts（双 Token 无感刷新 + `token` header 鉴权）
 */
import base from '../base';

const { get, post, put, delete: del } = base;

/** fetchCurrentEvents —— 后端路由 /api/event/events/current/ */
export const fetchCurrentEvents = (data?: any): Promise<any> => get('/api/event/events/current/');

/** fetchHistoricalEvents —— 后端路由 /api/event/events/historical/ */
export const fetchHistoricalEvents = (data?: any): Promise<any> => get('/api/event/events/historical/');

/** fetchMyActivities —— 后端路由 /api/event/my/activities/ */
export const fetchMyActivities = (data?: any): Promise<any> => get('/api/event/my/activities/');

/** fetchEventDetail —— 后端路由 /api/event/events/{event_id}/ */
export const fetchEventDetail = (eventId: number): Promise<any> => get(`/api/event/events/${eventId}/`);

/** createCommunityEvent —— 后端路由 /api/event/community_events/ */
export const createCommunityEvent = (data?: any): Promise<any> => post('/api/event/community_events/', data);

/** fetchParticipants —— 后端路由 /api/event/participants/ */
export const fetchParticipants = (data?: any): Promise<any> => get('/api/event/participants/');

/** signInSelf —— 后端路由 /api/event/participants/self_sign_in/ */
export const signInSelf = (data?: any): Promise<any> => post('/api/event/participants/self_sign_in/', data);

/** fetchEventParticipants —— 后端路由 /api/event/participants/{event_id}/ */
export const fetchEventParticipants = (eventId: number): Promise<any> => get(`/api/event/participants/${eventId}/`);

/** joinEvent —— 后端路由 /api/event/participants/ */
export const joinEvent = (data?: any): Promise<any> => post('/api/event/participants/', data);
