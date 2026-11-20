/**
 * 视频 / 相册 API 服务
 * 统一走 services/base.ts（双 Token 无感刷新 + `token` header 鉴权）
 */
import base from '../base';

const { get, post, put, delete: del } = base;

/** fetchVideoAlbums —— 后端路由 /api/video/show_album */
export const fetchVideoAlbums = (data?: any): Promise<any> => get('/api/video/show_album');

/** fetchAllVideo —— 后端路由 /api/video/all_video */
export const fetchAllVideo = (data?: any): Promise<any> => get('/api/video/all_video');

/** fetchAlbum —— 后端路由 /api/video/fetch_album/{albumid} */
export const fetchAlbum = (albumId: number): Promise<any> => get(`/api/video/fetch_album/${albumId}`);

/** watchVideo —— 后端路由 /api/video/watch_video/{videoid} */
export const watchVideo = (videoId: number): Promise<any> => get(`/api/video/watch_video/${videoId}`);

/** queryVideo —— 后端路由 /api/video/query_video */
export const queryVideo = (data?: any): Promise<any> => get('/api/video/query_video');

/** saveAlbum —— 后端路由 /api/video/save_album */
export const saveAlbum = (data?: any): Promise<any> => post('/api/video/save_album', data);

/** saveVideo —— 后端路由 /api/video/savevideo */
export const saveVideo = (data?: any): Promise<any> => post('/api/video/savevideo', data);

/** editAlbum —— 后端路由 /api/video/edit_album/{albumid} */
export const editAlbum = (albumId: number): Promise<any> => put(`/api/video/edit_album/${albumId}`, data);

/** deleteAlbum —— 后端路由 /api/video/delete_album/{albumid} */
export const deleteAlbum = (albumId: number): Promise<any> => del(`/api/video/delete_album/${albumId}`);
