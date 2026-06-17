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
      case 'develop': return 'https://zishu.co'
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
        'content-type': 'application/x-www-form-urlencoded',
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
