import { delay } from '../_utils/delay';
import { getBaseUrl } from '../base';

const images = [
  'https://zishuco.oss-cn-shanghai.aliyuncs.com/article/image/20260329131419.jpg',
  'https://zishuco.oss-cn-shanghai.aliyuncs.com/article/image/20260329131515.jpg',
  'https://zishuco.oss-cn-shanghai.aliyuncs.com/article/image/20260329131539.jpg',
  'https://zishuco.oss-cn-shanghai.aliyuncs.com/article/image/20260329131603.jpg',
  'https://zishuco.oss-cn-shanghai.aliyuncs.com/article/image/20260329131643.jpg',
  'https://zishuco.oss-cn-shanghai.aliyuncs.com/article/image/20260329131705.jpg',
];

export interface TabItem {
  text: string;
  key: string;
}

export interface InnoData {
  swiper: string[];
  tabList: TabItem[];
  activityImg: string;
}

export interface Project {
  id: number;
  publisher: string;
  publisher_id: number;
  taker: string;
  taker_id: number;
  shushi: string;
  shushi_id: number;
  task_serial: string;
  title: string;
  required_courses: string;
  bonus: number;
  desc: string;
  task_text: string;
  sln_text: string;
  comment: string;
  start_date: string;
  deadline: string;
  planed_hour: number;
  half_progress: string;
  finish_date: string;
  actual_hour: number;
  total_hour: number;
  update_date: string;
  status: string;
}

/** 获取创新页基础数据（轮播图 + 标签栏） */
function mockFetchInno(): Promise<InnoData> {
  return delay().then(() => ({
    swiper: images,
    tabList: [
      { text: '全部', key: '' },
      { text: '前端', key: 'F' },
      { text: '后端', key: 'B' },
      { text: '文档', key: 'D' },
      { text: '教程', key: 'T' },
      { text: '指南', key: 'G' },
      { text: '课程', key: 'C' },
      { text: '文件', key: 'W' },
    ],
    activityImg: '/img/activity.png',
  }));
}

/** 从后端获取创新页基础数据 */
function fetchInnoFromApi(): Promise<InnoData> {
  return mockFetchInno();
}

/** 从后端获取进行中的项目列表 */
function fetchProjectsFromApi(): Promise<Project[]> {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    wx.request({
      url: getBaseUrl() + '/api/inno/fetch_current_projects',
      method: 'GET',
      header: { token },
      success: (res: any) => {
        if (res.data && Array.isArray(res.data)) {
          resolve(res.data);
        } else {
          resolve([]);
        }
      },
      fail: () => {
        reject('请求失败');
      },
    });
  });
}

/** 认领项目 */
function claimProject(projectId: number): Promise<{ code: string }> {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    wx.request({
      url: getBaseUrl() + '/api/inno/edit_project/' + projectId,
      method: 'PUT',
      data: { 'params[action]': 'apply' },
      header: { token, 'content-type': 'application/x-www-form-urlencoded' },
      success: (res: any) => {
        resolve(res.data);
      },
      fail: () => {
        reject('请求失败');
      },
    });
  });
}

/** 获取指定类型的下一个课题编号 GET /api/inno/fetch_next_serial/{task_type} */
export function fetchNextSerial(taskType: string): Promise<string> {
  return new Promise((resolve) => {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    wx.request({
      url: getBaseUrl() + '/api/inno/fetch_next_serial/' + encodeURIComponent(taskType || 'F'),
      method: 'GET',
      header: { token },
      success: (res: any) => {
        resolve(typeof res.data === 'string' ? res.data : `${taskType || 'F'}001`);
      },
      fail: () => {
        resolve(`${taskType || 'F'}001`);
      },
    });
  });
}

/** 发布新创新项目 POST /api/inno/add_project */
export function addInnoProject(data: {
  task_serial: string;
  title: string;
  required_courses?: string;
  bonus: number;
  desc: string;
  start_date: string;
  deadline: string;
  planed_hour: number;
}): Promise<any> {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    wx.request({
      url: getBaseUrl() + '/api/inno/add_project',
      method: 'POST',
      data,
      header: { token, 'content-type': 'application/json' },
      success: (res: any) => resolve(res.data),
      fail: (err) => reject(err),
    });
  });
}

/** 更新项目（半程汇报 / 结束汇报 / 编辑） PUT /api/inno/edit_project/{project_id} */
export function updateInnoProject(
  projectId: number,
  params: Record<string, any>
): Promise<any> {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    const payload: Record<string, any> = {};
    Object.keys(params || {}).forEach((k) => {
      payload[`params[${k}]`] = params[k];
    });
    wx.request({
      url: getBaseUrl() + '/api/inno/edit_project/' + projectId,
      method: 'PUT',
      data: payload,
      header: { token, 'content-type': 'application/x-www-form-urlencoded' },
      success: (res: any) => resolve(res.data),
      fail: (err) => reject(err),
    });
  });
}

/** 获取单个创新任务详情 GET /api/inno/get_task/{task_id} */
export function getInnoTaskDetail(taskId: number | string): Promise<any> {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    wx.request({
      url: getBaseUrl() + '/api/inno/get_task/' + encodeURIComponent(String(taskId)),
      method: 'GET',
      header: { token },
      success: (res: any) => resolve(res.data || {}),
      fail: (err) => reject(err),
    });
  });
}

/** 保存/提交创新任务方案与塾师点评 POST /api/inno/save_task */
export function saveInnoTask(data: {
  id: number | string;
  action: 'save_pub' | 'save_sln' | 'submit_sln' | 'save_comment' | 'redo' | 'finish_task';
  content: string;
  title?: string;
  actual_hour?: number;
  reward?: number;
}): Promise<any> {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    wx.request({
      url: getBaseUrl() + '/api/inno/save_task',
      method: 'POST',
      data: {
        id: String(data.id),
        action: data.action,
        content: data.content || '',
        title: data.title || '',
        actual_hour: Number(data.actual_hour || 0),
        reward: Number(data.reward || 0),
      },
      header: { token, 'content-type': 'application/json' },
      success: (res: any) => resolve(res.data),
      fail: (err) => reject(err),
    });
  });
}

/** 获取全部共创小组列表 GET /api/inno/fetch_allgroup */
export function fetchAllGroupsFromApi(): Promise<any[]> {
  return new Promise((resolve) => {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    wx.request({
      url: getBaseUrl() + '/api/inno/fetch_allgroup',
      method: 'GET',
      header: { token },
      success: (res: any) => {
        resolve(Array.isArray(res.data) ? res.data : []);
      },
      fail: () => resolve([]),
    });
  });
}

/** 申请加入创新共创小组 POST /api/inno/join_group */
export function joinInnoGroup(data: {
  groupid: number | string;
  groupname: string;
  reason: string;
}): Promise<any> {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    wx.request({
      url: getBaseUrl() + '/api/inno/join_group',
      method: 'POST',
      data: {
        info: JSON.stringify(data),
      },
      header: { token, 'content-type': 'application/json' },
      success: (res: any) => resolve(res.data),
      fail: (err) => reject(err),
    });
  });
}

/** 102-attend.md: 获取我的小组周报出席记录 GET /api/inno/fetch_myattend */
export function fetchMyAttend(): Promise<any[]> {
  return new Promise((resolve) => {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    wx.request({
      url: getBaseUrl() + '/api/inno/fetch_myattend',
      method: 'GET',
      header: { token, Authorization: token ? `Bearer ${token}` : '' },
      success: (res: any) => {
        resolve(Array.isArray(res.data) ? res.data : []);
      },
      fail: () => resolve([]),
    });
  });
}

/** 102-attend.md: 保存小组周报考勤汇报 POST /api/inno/save_attend_report */
export function saveAttendReport(data: {
  attend_id?: number;
  group_id: number;
  member_id?: number;
  object: string;
  contrib: string;
  demand: string;
}): Promise<any> {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    wx.request({
      url: getBaseUrl() + '/api/inno/save_attend_report',
      method: 'POST',
      data: {
        attend_id: Number(data.attend_id || 0),
        group_id: Number(data.group_id || 0),
        member_id: Number(data.member_id || 0),
        object: data.object || '',
        contrib: data.contrib || '',
        demand: data.demand || '',
      },
      header: { token, Authorization: token ? `Bearer ${token}` : '', 'content-type': 'application/json' },
      success: (res: any) => resolve(res.data),
      fail: (err) => reject(err),
    });
  });
}

export const fetchInno = fetchInnoFromApi;
export { fetchProjectsFromApi, claimProject };
