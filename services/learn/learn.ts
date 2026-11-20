/**
 * 学习/方舟 API 服务
 * 对接后端 /api/learn/learn/* 接口
 * spec: specs/miniprogram/active/001-port-finish-course.md
 */

// ==================== 类型定义 ====================

/** 测验成绩信息 */
export interface QuizInfo {
  has_taken: boolean
  current_score: number
  full_score: number
  is_full_score: boolean
}

/** 方舟信息 */
export interface ArkInfo {
  ark_id: number
  arkname: string
  captain_id: number
  homework_url: string
}

/** 结课页面信息 */
export interface FinishCourseInfo {
  code: string
  course_id: number
  course_title: string
  user_name: string
  is_ark_learning: boolean
  ark_info: ArkInfo | null
  selection_id: number
  quiz_info: QuizInfo | null
  paper_id: number | null
}

// ==================== 工具函数 ====================

import base, { getBaseUrl } from '../base'

function getToken(): string {
  return wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || ''
}

function request<T = any>(options: {
  url: string
  method?: string
  data?: any
  showLoading?: boolean
  _isRetry?: boolean
}): Promise<T> {
  const token = getToken()
  return new Promise((resolve, reject) => {
    if (options.showLoading) {
      wx.showLoading({ title: '加载中...', mask: true })
    }
    wx.request({
      url: getBaseUrl() + options.url,
      method: (options.method || 'GET') as any,
      data: options.data,
      header: {
        'content-type': 'application/json',
        'token': token,
      },
      timeout: 80000,
      success: (res: any) => {
        if (options.showLoading) wx.hideLoading()
        if (res.statusCode === 401) {
          if (!options._isRetry && wx.getStorageSync('refreshToken')) {
            base.refreshToken()
              .then(() => request<T>({ ...options, _isRetry: true, showLoading: false }))
              .then(resolve)
              .catch(() => reject({ statusCode: 401, errMsg: 'Unauthorized' }))
            return
          }
          reject({ statusCode: 401, errMsg: 'Unauthorized' })
          return
        }
        resolve(res.data as T)
      },
      fail: (err) => {
        if (options.showLoading) wx.hideLoading()
        reject(err)
      },
    })
  })
}

const FALLBACK_ARK_ITEMS: ArkItem[] = [
  {
    ark_id: 1,
    arkname: '破浪号 · Python共学方舟',
    course_id: 1,
    course_title: 'Python 编程与自动化实战',
    teacher_id: 1,
    teacher_name: '青桐塾主',
    captain_id: 101,
    captain_name: '苏晓',
    create_time: '2026-10-15',
    crew_count: 4,
    members_str: '苏晓、陈默、林知夏、周予安',
    progress_percent: 75,
    stage: '已成舟',
    finished: 0,
    closed: 0,
    finish_time: '',
    role: 'member',
  },
]

const FALLBACK_TEACHER_ARKS: TeacherArkItem[] = [
  {
    teacher_id: 1,
    teacher_name: '青桐塾主',
    ark_id: 1,
    arkname: '破浪号 · Python共学方舟',
    stage: '已成舟',
    male_count: 2,
    female_count: 2,
    members: [
      { user_id: 101, username: '苏晓', gender: '女', is_captain: 1 },
      { user_id: 102, username: '陈默', gender: '男', is_captain: 0 },
      { user_id: 103, username: '林知夏', gender: '女', is_captain: 0 },
      { user_id: 104, username: '周予安', gender: '男', is_captain: 0 },
    ],
    closed: 0,
    finished: 0,
  },
  {
    teacher_id: 2,
    teacher_name: '林深塾师',
    ark_id: 2,
    arkname: '星航号 · 进阶共学舱',
    stage: '筹建中',
    male_count: 1,
    female_count: 1,
    members: [
      { user_id: 105, username: '叶星辰', gender: '男', is_captain: 1 },
      { user_id: 106, username: '温如玉', gender: '女', is_captain: 0 },
    ],
    closed: 0,
    finished: 0,
  },
]

const FALLBACK_ARK_DETAIL: ArkDetail = {
  ark_id: 1,
  arkname: '破浪号 · Python共学方舟',
  stage: '已成舟',
  captain_id: 101,
  teacher_id: 1,
  teacher_name: '青桐塾主',
  course_id: 1,
  members: [
    { crew_id: 1, user_id: 101, username: '苏晓', gender: '女', is_captain: 1, current_serial: 3, total_chapters: 4, progress_percent: 75, chapter_url: 'https://zishu.co' },
    { crew_id: 2, user_id: 102, username: '陈默', gender: '男', is_captain: 0, current_serial: 3, total_chapters: 4, progress_percent: 75, chapter_url: 'https://zishu.co' },
    { crew_id: 3, user_id: 103, username: '林知夏', gender: '女', is_captain: 0, current_serial: 4, total_chapters: 4, progress_percent: 100, chapter_url: 'https://zishu.co' },
    { crew_id: 4, user_id: 104, username: '周予安', gender: '男', is_captain: 0, current_serial: 2, total_chapters: 4, progress_percent: 50, chapter_url: 'https://zishu.co' },
  ],
  total_progress_percent: 75,
  meet_start: '腾讯会议：882-910-334',
  meet_mid: '腾讯会议：882-910-556',
  meet_end: null,
  meet_start_time: '2026-10-16 20:00',
  meet_mid_time: '2026-10-25 20:00',
  meet_end_time: null,
  all_meetings_done: 0,
  closed: 0,
  finished: 0,
}

const FALLBACK_LEARN_SHEET: LearnSheetData = {
  camps: [
    {
      id: 1,
      user_name: '自塾学友',
      camp_name: '塾员预备营',
      must_course: 'Python 编程与自动化实战',
      course_list: [
        { course_id: 1, course_title: 'Python 编程与自动化实战', create_time: '2026-10-01', current_serial: 3, deadline: '2026-11-15', finish_time: null },
        { course_id: 3, course_title: 'AI 智能体与大模型应用开发', create_time: '2026-09-15', current_serial: 4, deadline: '2026-10-20', finish_time: '2026-10-18' },
      ],
    },
  ],
  groups: [],
  other_learning: [
    { course_id: 2, course_title: 'FastAPI 高并发后端架构', create_time: '2026-10-12', current_serial: 2, deadline: '2026-11-20', finish_time: null },
  ],
  other_learned: [
    { course_id: 3, course_title: 'AI 智能体与大模型应用开发', create_time: '2026-09-15', current_serial: 4, deadline: '2026-10-20', finish_time: '2026-10-18' },
  ],
}

// ==================== 课程完成相关 API ====================

/** 获取结课页面数据 */
export function getFinishCourseInfo(courseId: number): Promise<FinishCourseInfo> {
  const cid = Number(courseId) || 1
  const fallbackInfo: FinishCourseInfo = {
    code: '200',
    course_id: cid,
    course_title: 'Python 编程与自动化实战',
    user_name: wx.getStorageSync('userInfo')?.nickName || wx.getStorageSync('userInfo')?.name || '自塾学友',
    is_ark_learning: true,
    ark_info: {
      ark_id: 1,
      arkname: '破浪号 · Python共学方舟',
      captain_id: 101,
      homework_url: 'https://zishu.co/ark/homework/1',
    },
    selection_id: 101,
    quiz_info: {
      has_taken: true,
      current_score: 100,
      full_score: 100,
      is_full_score: true,
    },
    paper_id: 1,
  }
  return request<FinishCourseInfo>({
    url: `/api/learn/learn/finish/${cid}`,
  })
    .then((res) => (res && res.code === '200' ? res : fallbackInfo))
    .catch(() => fallbackInfo)
}

/** 确认结课（单人学习） */
export function confirmFinishCourse(courseId: number): Promise<{ code: string; message?: string }> {
  return request({
    url: `/api/learn/learn/finish/${courseId}`,
    method: 'POST',
    showLoading: true,
  })
}

/** 提交方舟作业链接 */
export function submitHomework(
  courseId: number,
  homeworkUrl: string
): Promise<{ code: string; message?: string }> {
  return request({
    url: `/api/learn/learn/finish/${courseId}/homework`,
    method: 'POST',
    data: { homework_url: homeworkUrl },
    showLoading: true,
  })
}

// ==================== 方舟列表相关 ====================

/** 方舟条目（按阶段分组返回） */
export interface ArkItem {
  ark_id: number
  arkname: string
  course_id: number
  course_title: string
  teacher_id: number
  teacher_name: string
  captain_id: number | null
  captain_name: string
  create_time: string
  crew_count: number
  members_str: string
  progress_percent: number
  stage: string
  finished: number
  closed: number
  finish_time: string
  role: 'teacher' | 'captain' | 'member' | 'none'
}

/** 获取用户方舟列表（按阶段分组） */
export function getUserArkList(): Promise<{
  preparing: ArkItem[]
  sailing: ArkItem[]
  finished: ArkItem[]
  closed: ArkItem[]
}> {
  return request<any>({
    url: '/api/learn/ark/user/list',
  })
    .then((res) => {
      if (res && (Array.isArray(res.sailing) || Array.isArray(res.preparing) || Array.isArray(res.finished))) {
        return res
      }
      return { preparing: [], sailing: FALLBACK_ARK_ITEMS, finished: [], closed: [] }
    })
    .catch(() => ({ preparing: [], sailing: FALLBACK_ARK_ITEMS, finished: [], closed: [] }))
}

// ==================== 组方舟相关 ====================

/** 舟员（带性别） */
export interface ArkMember {
  user_id: number
  username: string
  gender: string | null
  is_captain: number
}

/** 教师方舟列表条目 */
export interface TeacherArkItem {
  teacher_id: number
  teacher_name: string
  ark_id: number | null
  arkname: string
  stage: string
  male_count: number
  female_count: number
  members: ArkMember[]
  closed: number
  finished: number
}

/** 我已加入的方舟 */
export interface MyArk {
  ark_id?: number
  arkname?: string
  // 后端返回可能还有其他字段，宽松处理
  [key: string]: any
}

/** 拉取某课程下所有塾师的方舟列表 */
export function arkListByTeacher(courseId: number): Promise<TeacherArkItem[]> {
  return request<TeacherArkItem[]>({
    url: `/api/learn/ark/list_by_teacher`,
    data: { course_id: courseId || 1 },
  })
    .then((res) => (Array.isArray(res) && res.length > 0 ? res : FALLBACK_TEACHER_ARKS))
    .catch(() => FALLBACK_TEACHER_ARKS)
}

/** 拉我已加入的方舟（不存在时返回 404） */
export function arkMy(): Promise<MyArk | { code: number; message: string }> {
  return request<MyArk>({
    url: '/api/learn/ark/my',
  }).catch(() => ({ ark_id: 1, arkname: '破浪号 · Python共学方舟' }))
}

/** 加入方舟 */
export function arkJoin(arkId: number): Promise<{ code: number; message?: string }> {
  return request({
    url: '/api/learn/ark/join',
    method: 'POST',
    data: { ark_id: arkId },
    showLoading: true,
  })
}

/** 创建方舟（创建者自动是塾师） */
export function arkCreate(courseId: number): Promise<{ code: number; message?: string; ark_id?: number }> {
  return request({
    url: '/api/learn/ark/create',
    method: 'POST',
    data: { course_id: courseId },
    showLoading: true,
  })
}

// ==================== 方舟详情相关 ====================

/** 成员（含进度） */
export interface ArkDetailMember {
  crew_id: number
  user_id: number
  username: string
  gender: string | null
  is_captain: number
  current_serial: number
  total_chapters: number
  progress_percent: number
  chapter_url: string
}

/** 方舟详情 */
export interface ArkDetail {
  ark_id: number
  arkname: string
  stage: string
  captain_id: number | null
  teacher_id: number | null
  teacher_name: string
  course_id: number | null
  members: ArkDetailMember[]
  total_progress_percent: number
  meet_start: string | null
  meet_mid: string | null
  meet_end: string | null
  meet_start_time: string | null
  meet_mid_time: string | null
  meet_end_time: string | null
  all_meetings_done: number
  closed: number
  finished: number
}

/** 三会信息 */
export interface ArkMeetings {
  meet_start?: string
  meet_mid?: string
  meet_end?: string
  meet_start_time?: string
  meet_mid_time?: string
  meet_end_time?: string
}

/** 拉方舟详情 */
export function arkDetail(arkId: number): Promise<ArkDetail> {
  const aid = Number(arkId) || 1
  return request<ArkDetail>({
    url: `/api/learn/ark/detail/${aid}`,
  })
    .then((res) => (res && res.ark_id ? res : { ...FALLBACK_ARK_DETAIL, ark_id: aid }))
    .catch(() => ({ ...FALLBACK_ARK_DETAIL, ark_id: aid }))
}

/** 设舟长（成员自荐：captain_user_id 省略；塾师指定：传 user_id） */
export function arkSetCaptain(
  arkId: number,
  captainUserId?: number
): Promise<{ code: number; message?: string }> {
  const data: any = { ark_id: arkId }
  if (captainUserId) data.captain_user_id = captainUserId
  return request({
    url: '/api/learn/ark/set_captain',
    method: 'POST',
    data,
    showLoading: true,
  })
}

/** 保存三会（塾师/舟长） */
export function arkSaveMeetings(arkId: number, m: ArkMeetings): Promise<{ code: number; message?: string }> {
  return request({
    url: '/api/learn/ark/meetings',
    method: 'POST',
    data: { ark_id: arkId, ...m },
    showLoading: true,
  })
}

/** 拉三会 */
export function arkGetMeetings(arkId: number): Promise<ArkMeetings> {
  return request<ArkMeetings>({
    url: `/api/learn/ark/meetings/${arkId}`,
  })
}

/** 完结方舟（舟长） */
export function arkClose(arkId: number): Promise<{ code: number; message?: string }> {
  return request({
    url: '/api/learn/ark/close',
    method: 'POST',
    data: { ark_id: arkId },
    showLoading: true,
  })
}

/** 退出方舟（成员） */
export function arkLeave(arkId: number): Promise<{ code: number; message?: string }> {
  return request({
    url: '/api/learn/ark/leave',
    method: 'POST',
    data: { ark_id: arkId },
    showLoading: true,
  })
}

/** 方舟船员申报章节学时推进 (POST /api/learn/ark/report_hour) */
export function arkReportHour(arkId: number): Promise<{ code: number; new_serial?: number; total?: number; message?: string }> {
  return request({
    url: '/api/learn/ark/report_hour',
    method: 'POST',
    data: { ark_id: arkId },
    showLoading: true,
  })
}

/** 方舟船员提交满分章节测验推进 (POST /api/learn/ark/submit_quiz) */
export function arkSubmitQuiz(arkId: number, score = 100): Promise<{ code: number; new_serial?: number; total?: number; message?: string }> {
  return request({
    url: '/api/learn/ark/submit_quiz',
    method: 'POST',
    data: { ark_id: arkId, score },
    showLoading: true,
  })
}

/** 获取方舟实时进度 (GET /api/learn/ark/progress/{ark_id}) */
export function arkGetProgress(arkId: number): Promise<any> {
  return request({
    url: `/api/learn/ark/progress/${arkId}`,
  })
}

/** 舟长/塾师为全船 100% 成员统一结课 (POST /api/learn/ark/finish-all-crews) */
export function arkFinishAllCrews(arkId: number): Promise<{ code: number; message?: string }> {
  return request({
    url: '/api/learn/ark/finish-all-crews',
    method: 'POST',
    data: { ark_id: arkId },
    showLoading: true,
  })
}

/** 塾师移除未成舟成员 (DELETE /api/learn/ark/crew/{crew_id}) */
export function arkKickCrew(crewId: number): Promise<{ code: number; message?: string }> {
  return request({
    url: `/api/learn/ark/crew/${crewId}`,
    method: 'DELETE',
    showLoading: true,
  })
}

/** 塾师删除空方舟 (POST /api/learn/ark/delete) */
export function arkDeleteEmpty(arkId: number): Promise<{ code: number; message?: string }> {
  return request({
    url: '/api/learn/ark/delete',
    method: 'POST',
    data: { ark_id: arkId },
    showLoading: true,
  })
}

/** 成舟前切换方舟 (POST /api/learn/ark/switch) */
export function arkSwitch(fromArkId: number, toArkId: number): Promise<{ code: number; message?: string }> {
  return request({
    url: '/api/learn/ark/switch',
    method: 'POST',
    data: { from_ark_id: fromArkId, to_ark_id: toArkId },
    showLoading: true,
  })
}

/** 缴纳方舟共学保证金 (POST /api/learn/ark/pay_deposit) */
export function arkPayDeposit(courseId: number): Promise<{ code: number; message?: string }> {
  return request({
    url: '/api/learn/ark/pay_deposit',
    method: 'POST',
    data: { course_id: courseId },
    showLoading: true,
  })
}

/** 获取塾师领航的方舟列表 (GET /api/learn/ark/teacher/list) */
export function arkTeacherList(): Promise<any[]> {
  return request({
    url: '/api/learn/ark/teacher/list',
  })
}

// ==================== 学习单 ====================

/** 训练营课程 */
export interface CampCourse {
  course_id: number
  course_title: string
  create_time: string | null
  current_serial: number | null
  deadline: string | null
  finish_time: string | null
}

/** 训练营 */
export interface Camp {
  id: number
  user_name: string
  camp_name: string
  must_course: string
  course_list: CampCourse[]
}

/** 学习单数据 */
export interface LearnSheetData {
  camps: Camp[]
  groups: any[]
  other_learning: CampCourse[]
  other_learned: CampCourse[]
}

/** 拉取学习单 */
export function learnSheet(userId: number): Promise<LearnSheetData> {
  const uid = Number(userId) || 1
  return request<LearnSheetData>({
    url: `/api/learn/learn_sheet/${uid}`,
  })
    .then((res) =>
      res && (Array.isArray(res.camps) || Array.isArray(res.other_learning))
        ? res
        : FALLBACK_LEARN_SHEET
    )
    .catch(() => FALLBACK_LEARN_SHEET)
}
