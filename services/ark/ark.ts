/**
 * 方舟（诺亚方舟） API 服务
 * 统一走 services/base.ts（双 Token 无感刷新 + `token` header 鉴权）
 */
import base from '../base';

const { get, post, put, delete: del } = base;

/** listArkByTeacher —— 后端路由 /api/learn/ark/list_by_teacher */
export const listArkByTeacher = (data?: any): Promise<any> => get('/api/learn/ark/list_by_teacher');

/** myArk —— 后端路由 /api/learn/ark/my */
export const myArk = (data?: any): Promise<any> => get('/api/learn/ark/my');

/** arkDetail —— 后端路由 /api/learn/ark/detail/{ark_id} */
export const arkDetail = (arkId: number): Promise<any> => get(`/api/learn/ark/detail/${arkId}`);

/** arkTeacherList —— 后端路由 /api/learn/ark/teacher/list */
export const arkTeacherList = (data?: any): Promise<any> => get('/api/learn/ark/teacher/list');

/** arkUserList —— 后端路由 /api/learn/ark/user/list */
export const arkUserList = (data?: any): Promise<any> => get('/api/learn/ark/user/list');

/** joinArk —— 后端路由 /api/learn/ark/join */
export const joinArk = (data?: any): Promise<any> => post('/api/learn/ark/join', data);

/** leaveArk —— 后端路由 /api/learn/ark/leave */
export const leaveArk = (data?: any): Promise<any> => post('/api/learn/ark/leave', data);

/** switchArk —— 后端路由 /api/learn/ark/switch */
export const switchArk = (data?: any): Promise<any> => post('/api/learn/ark/switch', data);

/** setCaptain —— 后端路由 /api/learn/ark/set_captain */
export const setCaptain = (data?: any): Promise<any> => post('/api/learn/ark/set_captain', data);

/** closeArk —— 后端路由 /api/learn/ark/close */
export const closeArk = (data?: any): Promise<any> => post('/api/learn/ark/close', data);

/** createArk —— 后端路由 /api/learn/ark/create */
export const createArk = (data?: any): Promise<any> => post('/api/learn/ark/create', data);

/** payArkDeposit —— 后端路由 /api/learn/ark/pay_deposit */
export const payArkDeposit = (data?: any): Promise<any> => post('/api/learn/ark/pay_deposit', data);

/** arkMeetings —— 后端路由 /api/learn/ark/meetings */
export const arkMeetings = (data?: any): Promise<any> => get('/api/learn/ark/meetings');

/** arkMeetingsById —— 后端路由 /api/learn/ark/meetings/{ark_id} */
export const arkMeetingsById = (arkId: number): Promise<any> => get(`/api/learn/ark/meetings/${arkId}`);

/** arkProgress —— 后端路由 /api/learn/ark/progress/{ark_id} */
export const arkProgress = (arkId: number): Promise<any> => get(`/api/learn/ark/progress/${arkId}`);

/** submitArkQuiz —— 后端路由 /api/learn/ark/submit_quiz */
export const submitArkQuiz = (data?: any): Promise<any> => post('/api/learn/ark/submit_quiz', data);

/** reportArkHour —— 后端路由 /api/learn/ark/report_hour */
export const reportArkHour = (data?: any): Promise<any> => post('/api/learn/ark/report_hour', data);

/** arkStatusByCourse —— 后端路由 /api/learn/ark/status_by_course */
export const arkStatusByCourse = (data?: any): Promise<any> => get('/api/learn/ark/status_by_course');

/** deleteArk —— 后端路由 /api/learn/ark/delete */
export const deleteArk = (data?: any): Promise<any> => del('/api/learn/ark/delete');

/** finishAllCrews —— 后端路由 /api/learn/ark/finish-all-crews */
export const finishAllCrews = (data?: any): Promise<any> => post('/api/learn/ark/finish-all-crews', data);

/** arkCrew —— 后端路由 /api/learn/ark/crew/{crew_id} */
export const arkCrew = (crewId: number): Promise<any> => get(`/api/learn/ark/crew/${crewId}`);
