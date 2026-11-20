/**
 * 社交 / 学伴 API 服务
 * 统一走 services/base.ts（双 Token 无感刷新 + `token` header 鉴权）
 */
import base from '../base';

const { get, post, put, delete: del } = base;

/** fetchAllUsers —— 后端路由 /api/users/fetch_all_users */
export const fetchAllUsers = (data?: any): Promise<any> => get('/api/users/fetch_all_users');

/** getUser —— 后端路由 /api/users/get_user/{user_id} */
export const getUser = (userId: number): Promise<any> => get(`/api/users/get_user/${userId}`);

/** quickGreet —— 后端路由 /api/users/quick_greet */
export const quickGreet = (data?: any): Promise<any> => post('/api/users/quick_greet', data);

/** confirmReserve —— 后端路由 /api/users/confirm_reserve */
export const confirmReserve = (data?: any): Promise<any> => post('/api/users/confirm_reserve', data);

/** confirmTalk —— 后端路由 /api/users/confirm_talk */
export const confirmTalk = (data?: any): Promise<any> => post('/api/users/confirm_talk', data);

/** finishTalk —— 后端路由 /api/users/finish_talk */
export const finishTalk = (data?: any): Promise<any> => post('/api/users/finish_talk', data);

/** editGoaltalk —— 后端路由 /api/users/edit_goaltalk */
export const editGoaltalk = (data?: any): Promise<any> => post('/api/users/edit_goaltalk', data);

/** fetchShushis —— 后端路由 /api/users/fetch_shushis/{user_id} */
export const fetchShushis = (userId: number): Promise<any> => get(`/api/users/fetch_shushis/${userId}`);

/** fetchShushengs —— 后端路由 /api/users/fetch_shushengs/{user_id} */
export const fetchShushengs = (userId: number): Promise<any> => get(`/api/users/fetch_shushengs/${userId}`);

/** cleanseUser —— 后端路由 /api/users/cleanse_user */
export const cleanseUser = (data?: any): Promise<any> => del('/api/users/cleanse_user');

/** fetchCleansed —— 后端路由 /api/users/fetch_cleansed */
export const fetchCleansed = (data?: any): Promise<any> => get('/api/users/fetch_cleansed');

/** fetchPro —— 后端路由 /api/users/pro */
export const fetchPro = (data?: any): Promise<any> => get('/api/users/pro');

/** fetchRegistrations —— 后端路由 /api/users/fetch_registrations */
export const fetchRegistrations = (data?: any): Promise<any> => get('/api/users/fetch_registrations');

/** handleRegistrations —— 后端路由 /api/users/handle_registrations */
export const handleRegistrations = (data?: any): Promise<any> => post('/api/users/handle_registrations', data);

/** handleReplace —— 后端路由 /api/users/handle_replace */
export const handleReplace = (data?: any): Promise<any> => post('/api/users/handle_replace', data);

/** resetPass —— 后端路由 /api/users/reset_pass */
export const resetPass = (data?: any): Promise<any> => post('/api/users/reset_pass', data);

/** handleResetPass —— 后端路由 /api/users/handle_reset_pass */
export const handleResetPass = (data?: any): Promise<any> => post('/api/users/handle_reset_pass', data);

/** fetchResetList —— 后端路由 /api/users/reset_list */
export const fetchResetList = (data?: any): Promise<any> => get('/api/users/reset_list');

/** deleteProfile —— 后端路由 /api/users/delete_profile */
export const deleteProfile = (data?: any): Promise<any> => del('/api/users/delete_profile');

/** checkFavor —— 后端路由 /api/users/check_favor */
export const checkFavor = (data?: any): Promise<any> => post('/api/users/check_favor', data);

/** addFavor —— 后端路由 /api/users/add_favor */
export const addFavor = (data?: any): Promise<any> => post('/api/users/add_favor', data);

/** fetchFavor —— 后端路由 /api/users/fetch_favor/{fid} */
export const fetchFavor = (favId: number): Promise<any> => get(`/api/users/fetch_favor/${favId}`);

/** deleteFavor —— 后端路由 /api/users/delete_favor/{fid} */
export const deleteFavor = (favId: number): Promise<any> => del(`/api/users/delete_favor/${favId}`);

/** aiCoachReply —— 后端路由 /api/users/ai_coach_reply */
export const aiCoachReply = (data?: any): Promise<any> => post('/api/users/ai_coach_reply', data);

/** socialPlaza —— 后端路由 /api/users/social_plaza */
export const socialPlaza = (data?: any): Promise<any> => get('/api/users/social_plaza');
