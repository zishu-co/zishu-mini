/**
 * 考试 / 题目 / 讲答 API 服务
 * 统一走 services/base.ts（双 Token 无感刷新 + `token` header 鉴权）
 */
import base from '../base';

const { get, post, put, delete: del } = base;

/** fetchPapers —— 后端路由 /api/ques/fetchpapers */
export const fetchPapers = (data?: any): Promise<any> => get('/api/ques/fetchpapers');

/** showTest —— 后端路由 /api/ques/showtest */
export const showTest = (data?: any): Promise<any> => get('/api/ques/showtest');

/** fetchPaper —— 后端路由 /api/ques/fetchpaper/{paperid} */
export const fetchPaper = (paperId: number): Promise<any> => get(`/api/ques/fetchpaper/${paperId}`);

/** addNewQues —— 后端路由 /api/ques/addnewqu */
export const addNewQues = (data?: any): Promise<any> => post('/api/ques/addnewqu', data);

/** savePaper —— 后端路由 /api/ques/savepaper */
export const savePaper = (data?: any): Promise<any> => post('/api/ques/savepaper', data);

/** searchQues —— 后端路由 /api/ques/searchques */
export const searchQues = (data?: any): Promise<any> => get('/api/ques/searchques');

/** showQues —— 后端路由 /api/ques/showques */
export const showQues = (data?: any): Promise<any> => get('/api/ques/showques');

/** fetchJianda —— 后端路由 /api/ques/fetchjianda/{ppid} */
export const fetchJianda = (ppid: number): Promise<any> => get(`/api/ques/fetchjianda/${ppid}`);

/** reviewJianda —— 后端路由 /api/ques/reviewjianda */
export const reviewJianda = (data?: any): Promise<any> => post('/api/ques/reviewjianda', data);

/** showWrong —— 后端路由 /api/ques/showwrong/{ppid} */
export const showWrong = (ppid: number): Promise<any> => get(`/api/ques/showwrong/${ppid}`);

/** fetchQues —— 后端路由 /api/ques/fetchques/{quesid} */
export const fetchQues = (quesId: number): Promise<any> => get(`/api/ques/fetchques/${quesId}`);

/** fetchQueses —— 后端路由 /api/ques/fetchqueses */
export const fetchQueses = (data?: any): Promise<any> => get('/api/ques/fetchqueses');

/** deletePaper —— 后端路由 /api/ques/deletepaper/{paperid} */
export const deletePaper = (paperId: number): Promise<any> => del(`/api/ques/deletepaper/${paperId}`);

/** deleteQues —— 后端路由 /api/ques/deleteques/{quesid} */
export const deleteQues = (quesId: number): Promise<any> => del(`/api/ques/deleteques/${quesId}`);

/** fetchTransById —— 后端路由 /api/ques/fetchtrans/by_id/{user_id} */
export const fetchTransById = (userId: number): Promise<any> => get(`/api/ques/fetchtrans/by_id/${userId}`);

/** fetchTrans —— 后端路由 /api/ques/fetchtrans/{candiname} */
export const fetchTrans = (candiName: string): Promise<any> => get(`/api/ques/fetchtrans/${candiName}`);

/** insertBatchQues —— 后端路由 /api/ques/insertbatchques */
export const insertBatchQues = (data?: any): Promise<any> => post('/api/ques/insertbatchques', data);

/** processBatchQues —— 后端路由 /api/ques/processbatchques */
export const processBatchQues = (data?: any): Promise<any> => post('/api/ques/processbatchques', data);
