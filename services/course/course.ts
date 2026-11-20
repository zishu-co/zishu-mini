/**
 * 课程 API 服务
 * 对接后端 /api/learn/* 接口（原 /api/course/* 已迁移）
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
  user_id?: number;
  user_name?: string;
  course_title: string;
  course_id: number;
  chapter_title: string;
  chapter_id: number;
  current_serial: number;
  deadline: string;
  url: string;
  shushi_id?: number;
  shushi_name?: string;
  is_last_declared?: boolean;
  total_chapters?: number;
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

import base, { getBaseUrl } from '../base';

function getToken(): string {
  return wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
}

function request<T = any>(options: {
  url: string;
  method?: string;
  data?: any;
  showLoading?: boolean;
  contentType?: string;
  _isRetry?: boolean;
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
        'content-type': options.contentType || 'application/json',
        'token': token,
      },
      timeout: 80000,
      success: (res: any) => {
        if (options.showLoading) wx.hideLoading();
        // 检查 HTTP 状态码，401 需要鉴权
        if (res.statusCode === 401) {
          if (!options._isRetry && wx.getStorageSync('refreshToken')) {
            base.refreshToken()
              .then(() => request<T>({ ...options, _isRetry: true, showLoading: false }))
              .then(resolve)
              .catch(() => reject({ statusCode: 401, errMsg: 'Unauthorized' }));
            return;
          }
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

const FALLBACK_COURSES: Course[] = [
  {
    id: 1,
    title: 'Python 编程与自动化实战',
    director_id: 1,
    director_name: '青桐塾主',
    desc: '零基础掌握 Python 核心语法、数据处理与 AI 办公自动化脚本实战。',
    create_time: '2026-09-01',
    current_selections_num: 18,
    finish_selections_num: 42,
  },
  {
    id: 2,
    title: 'FastAPI 高并发后端架构',
    director_id: 2,
    director_name: '林深塾师',
    desc: '基于 Python FastAPI、SQLAlchemy 2.0 与 PostgreSQL 构建工业级微服务。',
    create_time: '2026-09-10',
    current_selections_num: 14,
    finish_selections_num: 29,
  },
  {
    id: 3,
    title: 'AI 智能体与大模型应用开发',
    director_id: 1,
    director_name: '青桐塾主',
    desc: '从 Prompt 工程、RAG 向量检索到多智能体工作流落地的全栈实战课程。',
    create_time: '2026-09-20',
    current_selections_num: 26,
    finish_selections_num: 35,
  },
];

const FALLBACK_SELECTIONS: CurrentSelection[] = [
  {
    sele_id: 101,
    user_id: 1,
    user_name: '苏晓',
    course_title: 'Python 编程与自动化实战',
    course_id: 1,
    chapter_title: '第2章：函数模块与文件批处理',
    chapter_id: 2,
    current_serial: 2,
    deadline: '2026-11-15',
    url: 'https://zishu.co',
    shushi_id: 1,
    shushi_name: '青桐塾主',
    is_last_declared: false,
    total_chapters: 4,
  },
  {
    sele_id: 102,
    user_id: 2,
    user_name: '陈默',
    course_title: 'AI 智能体与大模型应用开发',
    course_id: 3,
    chapter_title: '第3章：RAG 知识库与向量检索',
    chapter_id: 3,
    current_serial: 3,
    deadline: '2026-11-10',
    url: 'https://zishu.co',
    shushi_id: 2,
    shushi_name: '林深塾师',
    is_last_declared: false,
    total_chapters: 4,
  },
];

// ==================== API 方法 ====================

/** 获取全部课程列表 */
export function fetchAllCourses(): Promise<Course[]> {
  return request<Course[]>({ url: '/api/learn/fetch_all_courses' })
    .then((res) => (Array.isArray(res) && res.length > 0 ? res : FALLBACK_COURSES))
    .catch(() => FALLBACK_COURSES);
}

/** 获取当前用户的在读课程 */
export function fetchCurrentSelections(): Promise<CurrentSelection[]> {
  return request<CurrentSelection[]>({ url: '/api/learn/fetch_current_selections' })
    .then((res) => (Array.isArray(res) && res.length > 0 ? res : FALLBACK_SELECTIONS))
    .catch(() => FALLBACK_SELECTIONS);
}

/** 获取全塾所有在读选课记录（督学看板使用） */
export function fetchAllSelections(): Promise<CurrentSelection[]> {
  return request<CurrentSelection[]>({ url: '/api/learn/fetch_selections' })
    .then((res) => (Array.isArray(res) && res.length > 0 ? res : FALLBACK_SELECTIONS))
    .catch(() => FALLBACK_SELECTIONS);
}

/** 主持人/管理员快速编辑课程标题与描述 */
export function quickUpdateCourse(course_id: number, title: string, desc: string): Promise<any> {
  return request({
    url: '/api/learn/quick_update_course',
    method: 'POST',
    data: { course_id, title, desc },
    showLoading: true,
  });
}

/** 选课（loading 由调用方控制，不在服务层弹） */
export function selectCourse(id: number, courseid: number): Promise<any> {
  return request({ url: '/api/learn/select_course', method: 'POST', data: { id, courseid } });
}

/** 退选（loading 由调用方控制，不在服务层弹） */
export function quitCourse(id: number, courseid: number, reason: string): Promise<any> {
  return request({ url: '/api/learn/quit_course', method: 'POST', data: { id, courseid, reason } });
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
    url: '/api/learn/report_learn',
    method: 'POST',
    data: { chapter_id, course_id, chapter_title, sele_id, reported_hour },
    contentType: 'application/json',
    showLoading: true,
  });
}

/** 获取可选塾师列表 */
export function calMentors(courseId: number): Promise<CalMentorsResult> {
  return request<CalMentorsResult>({ url: '/api/learn/cal_mentors/' + courseId }).catch(() => ({
    course_title: 'Python 编程与自动化实战',
    course_id: courseId || 1,
    director_id: 1,
    director_name: '青桐塾主',
    mentor_count: 1,
    mentors: [
      { shushi_id: 1, shushi_name: '青桐塾主', course_id: courseId || 1 },
      { shushi_id: 2, shushi_name: '林深塾师', course_id: courseId || 1 },
    ],
  }));
}

/** 选择塾师 */
export function selectMentor(shushi_id: number, courseid: number): Promise<any> {
  return request({ url: '/api/learn/select_mentor', method: 'POST', data: { shushi_id, courseid }, showLoading: true });
}

// ==================== 课程详情相关类型 ====================

export interface CourseDetail {
  course: {
    id: number;
    title: string;
    director_id: number;
    director_name: string;
    desc: string;
  };
  chapters: Chapter[];
  current: StudentRecord[];
  finish: StudentRecord[];
}

export interface StudentRecord {
  user_id?: number;
  user_name?: string;
  shushi_id?: number;
  shushi_name?: string;
  current_serial?: number;
  deadline?: string;
  finish_date?: string;
}

/** 获取课程详情（章节 + 同塾信息） */
export function getCourseDetail(courseId: number): Promise<CourseDetail> {
  const cid = Number(courseId) || 1;
  const fallbackCourse = FALLBACK_COURSES.find((c) => c.id === cid) || FALLBACK_COURSES[0];
  const fallbackDetail: CourseDetail = {
    course: {
      id: fallbackCourse.id,
      title: fallbackCourse.title,
      director_id: fallbackCourse.director_id,
      director_name: fallbackCourse.director_name,
      desc: fallbackCourse.desc,
    },
    chapters: [
      { id: 1, title: '第1章：核心概念与环境搭建', author_id: 1, author_name: '青桐塾主', period: '7天', url: 'https://zishu.co', serial: 1 },
      { id: 2, title: '第2章：模块化设计与数据处理', author_id: 1, author_name: '青桐塾主', period: '7天', url: 'https://zishu.co', serial: 2 },
      { id: 3, title: '第3章：自动化工程实践与调优', author_id: 2, author_name: '林深塾师', period: '7天', url: 'https://zishu.co', serial: 3 },
      { id: 4, title: '第4章：综合结课项目与测评通关', author_id: 1, author_name: '青桐塾主', period: '7天', url: 'https://zishu.co', serial: 4 },
    ],
    current: [
      { user_id: 101, user_name: '苏晓', shushi_id: 1, shushi_name: '青桐塾主', current_serial: 2, deadline: '2026-11-15' },
      { user_id: 102, user_name: '陈默', shushi_id: 2, shushi_name: '林深塾师', current_serial: 3, deadline: '2026-11-18' },
    ],
    finish: [
      { user_id: 103, user_name: '林知夏', shushi_id: 1, shushi_name: '青桐塾主', finish_date: '2026-10-20' },
    ],
  };
  return request<CourseDetail>({ url: '/api/learn/get_course/' + cid })
    .then((res) => (res && res.course ? res : fallbackDetail))
    .catch(() => fallbackDetail);
}
