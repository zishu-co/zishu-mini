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

function getBaseUrl(): string {
  try {
    const { envVersion } = wx.getAccountInfoSync().miniProgram
    switch (envVersion) {
      case 'develop': return 'http://127.0.0.1:8008';
      case 'trial': return 'https://zishu.co'
      case 'release': return 'https://zishu.co'
      default: return 'https://zishu.co'
    }
  } catch (e) {
    return 'https://zishu.co'
  }
}

function getToken(): string {
  return wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || ''
}

function request<T = any>(options: {
  url: string
  method?: string
  data?: any
  showLoading?: boolean
  contentType?: string
}): Promise<T> {
  const token = getToken()
  const contentType = options.contentType || 'application/x-www-form-urlencoded'
  return new Promise((resolve, reject) => {
    if (options.showLoading) {
      wx.showLoading({ title: '加载中...', mask: true })
    }
    wx.request({
      url: getBaseUrl() + options.url,
      method: (options.method || 'GET') as any,
      data: options.data,
      header: {
        'content-type': contentType,
        'token': token,
      },
      timeout: 80000,
      success: (res: any) => {
        if (options.showLoading) wx.hideLoading()
        if (res.statusCode === 401) {
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

// ==================== 课程完成相关 API ====================

/** 获取结课页面数据 */
export function getFinishCourseInfo(courseId: number): Promise<FinishCourseInfo> {
  return request<FinishCourseInfo>({
    url: `/api/learn/learn/finish/${courseId}`,
    showLoading: true,
  })
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
    method: 'PATCH',
    data: { homework_url: homeworkUrl },
    showLoading: true,
    contentType: 'application/json',
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
  return request({
    url: '/api/learn/ark/user/list',
  })
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
    data: { course_id: courseId },
  })
}

/** 拉我已加入的方舟（不存在时返回 404） */
export function arkMy(): Promise<MyArk | { code: number; message: string }> {
  return request<MyArk>({
    url: '/api/learn/ark/my',
  })
}

/** 加入方舟 */
export function arkJoin(arkId: number): Promise<{ code: number; message?: string }> {
  return request({
    url: '/api/learn/ark/join',
    method: 'POST',
    data: { ark_id: arkId },
    showLoading: true,
    contentType: 'application/json',
  })
}

/** 创建方舟（创建者自动是塾师） */
export function arkCreate(courseId: number): Promise<{ code: number; message?: string; ark_id?: number }> {
  return request({
    url: '/api/learn/ark/create',
    method: 'POST',
    data: { course_id: courseId },
    showLoading: true,
    contentType: 'application/json',
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
  return request<ArkDetail>({
    url: `/api/learn/ark/detail/${arkId}`,
    showLoading: true,
  })
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
    contentType: 'application/json',
  })
}

/** 保存三会（塾师/舟长） */
export function arkSaveMeetings(arkId: number, m: ArkMeetings): Promise<{ code: number; message?: string }> {
  return request({
    url: '/api/learn/ark/meetings',
    method: 'POST',
    data: { ark_id: arkId, ...m },
    showLoading: true,
    contentType: 'application/json',
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
    contentType: 'application/json',
  })
}

/** 退出方舟（成员） */
export function arkLeave(arkId: number): Promise<{ code: number; message?: string }> {
  return request({
    url: '/api/learn/ark/leave',
    method: 'POST',
    data: { ark_id: arkId },
    showLoading: true,
    contentType: 'application/json',
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
  return request<LearnSheetData>({
    url: `/api/learn/learn_sheet/${userId}`,
    showLoading: true,
  })
}
