/**
 * 课程 API 服务
 * 对接后端 /api/course/* 接口
 */

// ==================== 类型定义 ====================

export interface Chapter {
  id: number;
  title: string;
  author_id: number;
  author_name: string;
  period: string;
  url: string;
  serial: number;
}

export interface Course {
  id: number;
  title: string;
  director_id: number;
  director_name: string;
  desc: string;
  create_time: string;
  current_selections_num: number;
  finish_selections_num: number;
}

export interface CurrentSelection {
  sele_id: number;
  course_title: string;
  course_id: number;
  chapter_title: string;
  chapter_id: number;
  current_serial: number;
  deadline: string;
  url: string;
  shushi_id?: number;
  shushi_name?: string;
}

export interface Mentor {
  shushi_id: number;
  shushi_name: string;
  course_id: number;
}

export interface CalMentorsResult {
  course_title: string;
  course_id: number;
  director_id: number;
  director_name: string;
  mentor_count: number;
  mentors: Mentor[];
}

// ==================== 工具函数 ====================

function getBaseUrl(): string {
  try {
    const { envVersion } = wx.getAccountInfoSync().miniProgram;
    switch (envVersion) {
      case 'develop': return 'https://zishu.co';
      case 'trial': return 'https://zishu.co';
      case 'release': return 'https://zishu.co';
      default: return 'https://zishu.co';
    }
  } catch (e) {
    return 'https://zishu.co';
  }
}

function getToken(): string {
  return wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
}

function request<T = any>(options: {
  url: string;
  method?: string;
  data?: any;
  showLoading?: boolean;
}): Promise<T> {
  const token = getToken();
  return new Promise((resolve, reject) => {
    if (options.showLoading) {
      wx.showLoading({ title: '加载中...', mask: true });
    }
    wx.request({
      url: getBaseUrl() + options.url,
      method: (options.method || 'GET') as any,
      data: options.data,
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'token': token,
      },
      timeout: 80000,
      success: (res: any) => {
        if (options.showLoading) wx.hideLoading();
        // 检查 HTTP 状态码，401 需要鉴权
        if (res.statusCode === 401) {
          reject({ statusCode: 401, errMsg: 'Unauthorized' });
          return;
        }
        resolve(res.data as T);
      },
      fail: (err) => {
        if (options.showLoading) wx.hideLoading();
        reject(err);
      }
    });
  });
}

// ==================== API 方法 ====================

/** 获取全部课程列表 */
export function fetchAllCourses(): Promise<Course[]> {
  return request<Course[]>({ url: '/api/course/fetch_all_courses' });
}

/** 获取当前用户的在读课程 */
export function fetchCurrentSelections(): Promise<CurrentSelection[]> {
  return request<CurrentSelection[]>({ url: '/api/course/fetch_current_selections' });
}

/** 选课（loading 由调用方控制，不在服务层弹） */
export function selectCourse(id: number, courseid: number): Promise<any> {
  return request({ url: '/api/course/select_course', method: 'POST', data: { id, courseid } });
}

/** 退选（loading 由调用方控制，不在服务层弹） */
export function quitCourse(id: number, courseid: number, reason: string): Promise<any> {
  return request({ url: '/api/course/quit_course', method: 'POST', data: { id, courseid, reason } });
}

/** 申报学习时长 */
export function reportLearn(
  chapter_id: number,
  course_id: number,
  chapter_title: string,
  sele_id: number,
  reported_hour: string
): Promise<any> {
  return request({
    url: '/api/course/report_learn',
    method: 'POST',
    data: { chapter_id, course_id, chapter_title, sele_id, reported_hour },
    showLoading: true,
  });
}

/** 获取可选塾师列表 */
export function calMentors(courseId: number): Promise<CalMentorsResult> {
  return request<CalMentorsResult>({ url: '/api/course/cal_mentors/' + courseId });
}

/** 选择塾师 */
export function selectMentor(shushi_id: number, courseid: number): Promise<any> {
  return request({ url: '/api/course/select_mentor', method: 'POST', data: { shushi_id, courseid }, showLoading: true });
}
