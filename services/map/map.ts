/**
 * 思维导图 API 服务
 * 统一走 services/base.ts（双 Token 无感刷新 + `token` header 鉴权）
 */
import base from '../base';

const { get, post, put, delete: del } = base;

/** showMap —— 后端路由 /api/map/show_map */
export const showMap = (data?: any): Promise<any> => get('/api/map/show_map');

/** searchMap —— 后端路由 /api/map/search */
export const searchMap = (data?: any): Promise<any> => get('/api/map/search');

/** saveMap —— 后端路由 /api/map/save_map */
export const saveMap = (data?: any): Promise<any> => post('/api/map/save_map', data);

/** getMap —— 后端路由 /api/map/get_map/{mapid} */
export const getMap = (mapId: number): Promise<any> => get(`/api/map/get_map/${mapId}`);

/** deleteMap —— 后端路由 /api/map/delete_map/{mapid} */
export const deleteMap = (mapId: number): Promise<any> => del(`/api/map/delete_map/${mapId}`);
