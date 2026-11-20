/**
 * 营地 API 服务
 * 统一走 services/base.ts（双 Token 无感刷新 + `token` header 鉴权）
 */
import base from '../base';

const { get, post, put, delete: del } = base;

/** getCamp —— 后端路由 /api/learn/get_camp/{campid} */
export const getCamp = (campId: number): Promise<any> => get(`/api/learn/get_camp/${campId}`);

/** joinCamp —— 后端路由 /api/learn/join_camp */
export const joinCamp = (data?: any): Promise<any> => post('/api/learn/join_camp', data);

/** handleJoinCamp —— 后端路由 /api/learn/handle_joincamp */
export const handleJoinCamp = (data?: any): Promise<any> => post('/api/learn/handle_joincamp', data);

/** handleQuitCamp —— 后端路由 /api/learn/handle_quitcamp */
export const handleQuitCamp = (data?: any): Promise<any> => post('/api/learn/handle_quitcamp', data);

/** fetchCamps —— 后端路由 /api/manage/fetch_camps */
export const fetchCamps = (data?: any): Promise<any> => get('/api/manage/fetch_camps');

/** saveCamps —— 后端路由 /api/manage/save_camps */
export const saveCamps = (data?: any): Promise<any> => post('/api/manage/save_camps', data);
