/**
 * 专栏 / 文章 API 服务
 * 统一走 services/base.ts（双 Token 无感刷新 + `token` header 鉴权）
 */
import base from '../base';

const { get, post, put, delete: del } = base;

/** fetchZhuanlans —— 后端路由 /api/article/showzhuanlan */
export const fetchZhuanlans = (data?: any): Promise<any> => get('/api/article/showzhuanlan/');

/** fetchZhuanlan —— 后端路由 /api/article/zhuanlan/{zhuanlanid} */
export const fetchZhuanlan = (zhuanlanId: number): Promise<any> => get(`/api/article/zhuanlan/${zhuanlanId}`);

/** saveArticle —— 后端路由 /api/article/save */
export const saveArticle = (data?: any): Promise<any> => post('/api/article/save', data);

/** searchArticle —— 后端路由 /api/article/searcharticle */
export const searchArticle = (data?: any): Promise<any> => get('/api/article/searcharticle');

/** deleteArticle —— 后端路由 /api/article/delete */
export const deleteArticle = (data?: any): Promise<any> => del('/api/article/delete');

/** saveZhuanlan —— 后端路由 /api/article/savezhuanlan */
export const saveZhuanlan = (data?: any): Promise<any> => post('/api/article/savezhuanlan', data);

/** editZhuanlan —— 后端路由 /api/article/editzhuanlan/{zhuanlanid} */
export const editZhuanlan = (zhuanlanId: number): Promise<any> => put(`/api/article/editzhuanlan/${zhuanlanId}`, data);

/** deleteZhuanlan —— 后端路由 /api/article/deletezhuanlan/{zhuanlanid} */
export const deleteZhuanlan = (zhuanlanId: number): Promise<any> => del(`/api/article/deletezhuanlan/${zhuanlanId}`);

/** uploadArticle —— 后端路由 /api/article/upload */
export const uploadArticle = (data?: any): Promise<any> => post('/api/article/upload', data);
