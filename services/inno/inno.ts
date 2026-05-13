import { delay } from '../_utils/delay';

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
      url: 'https://zishu.co/api/inno/fetch_current_projects',
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
      url: 'https://zishu.co/api/inno/edit_project/' + projectId,
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

export const fetchInno = fetchInnoFromApi;
export { fetchProjectsFromApi, claimProject };
