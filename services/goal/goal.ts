/**
 * 目标驾驶舱 API 服务
 * 统一走 services/base.ts（双 Token 无感刷新 + `token` header 鉴权）
 */
import base from '../base';

const { get, post, put, delete: del } = base;

/** fetchGoal —— 后端路由 /api/users/fetch_goal/{user_id} */
export const fetchGoal = (userId: number): Promise<any> => get(`/api/users/fetch_goal/${userId}`);

/** saveGoal —— 后端路由 /api/users/save_goal */
export const saveGoal = (data?: any): Promise<any> => post('/api/users/save_goal', data);

/** updateGoalProgress —— 后端路由 /api/goals/update_progress */
export const updateGoalProgress = (data?: any): Promise<any> => post('/api/goals/update_progress', data);

/** abandonGoal —— 后端路由 /api/goals/{goal_id}/abandon */
export const abandonGoal = (goalId: number): Promise<any> => post(`/api/goals/${goalId}/abandon`, data);

/** saveGoalV2 —— 后端路由 /api/goals/save_goal */
export const saveGoalV2 = (data?: any): Promise<any> => post('/api/goals/save_goal', data);

/** fetchGoalV2 —— 后端路由 /api/goals/fetch_goal */
export const fetchGoalV2 = (data?: any): Promise<any> => get('/api/goals/fetch_goal');

/** getGoal —— 后端路由 /api/goals/{goal_id} */
export const getGoal = (goalId: number): Promise<any> => get(`/api/goals/${goalId}`);

/** planActions —— 后端路由 /api/coze/plan_actions */
export const planActions = (data?: any): Promise<any> => post('/api/coze/plan_actions', data);
