/**
 * 选课 / 学时 / 学习单 API 服务
 * 统一走 services/base.ts（双 Token 无感刷新 + `token` header 鉴权）
 */
import base from '../base';

const { get, post, put, delete: del } = base;

/** saveCourse —— 后端路由 /api/learn/save_course */
export const saveCourse = (data?: any): Promise<any> => post('/api/learn/save_course', data);

/** saveDraft —— 后端路由 /api/learn/save_draft */
export const saveDraft = (data?: any): Promise<any> => post('/api/learn/save_draft', data);

/** loadDraft —— 后端路由 /api/learn/load_draft */
export const loadDraft = (data?: any): Promise<any> => get('/api/learn/load_draft');

/** cleanseMentor —— 后端路由 /api/learn/cleanse_mentor */
export const cleanseMentor = (data?: any): Promise<any> => post('/api/learn/cleanse_mentor', data);

/** fetchMentors —— 后端路由 /api/learn/fetch_mentors */
export const fetchMentors = (data?: any): Promise<any> => get('/api/learn/fetch_mentors');

/** listAllMentors —— 后端路由 /api/learn/list_all_mentors */
export const listAllMentors = (data?: any): Promise<any> => get('/api/learn/list_all_mentors');

/** fetchLearnSheet —— 后端路由 /api/learn/learn_sheet/{id} */
export const fetchLearnSheet = (id: number): Promise<any> => get(`/api/learn/learn_sheet/${id}`);

/** finishCourse —— 后端路由 /api/learn/learn/finish/{course_id} */
export const finishCourse = (courseId: number, data?: any): Promise<any> => post(`/api/learn/learn/finish/${courseId}`, data);

/** submitHomework —— 后端路由 /api/learn/learn/finish/{course_id}/homework */
export const submitHomework = (courseId: number, data?: any): Promise<any> => post(`/api/learn/learn/finish/${courseId}/homework`, data);

/** fetchSelections —— 后端路由 /api/learn/fetch_selections */
export const fetchSelections = (data?: any): Promise<any> => get('/api/learn/fetch_selections');
