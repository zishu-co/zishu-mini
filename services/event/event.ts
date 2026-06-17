/**
 * 活动 API 服务
 * 对接后端 /api/event/* 接口
 * spec: specs/port/archive/006-port-event-list.md
 *      specs/port/archive/007-port-event-participants.md
 */

// ==================== 类型定义 ====================

/** 活动条目 */
export interface EventItem {
  id: number
  title: string
  poster: string
  url: string
  desc: string | null
  start_time: string
  location: string
  is_finished: boolean
  finished_time: string | null
  participant_count: number
  related_id: number | null
  related_type: string | null
  created_at: string
  updated_at: string
}

/** 参与者条目 */
export interface ParticipantItem {
  id: number
  user_id: number
  username: string
  event_id: number
  join_time: string
  sign_in_time: string | null
  payed_amount: number
  payment_method: string
  is_payed: boolean
  is_signed_in: boolean
  absence_reason: string | null
  created_at: string
  updated_at: string
}

/** 报名响应 */
export interface JoinEventResult {
  code: string
  message: string
  participant_id?: number
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
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  showLoading?: boolean
  loadingText?: string
}): Promise<T> {
  return new Promise((resolve, reject) => {
    if (options.showLoading) {
      wx.showLoading({ title: options.loadingText || '加载中...', mask: true })
    }
    wx.request({
      url: getBaseUrl() + options.url,
      method: (options.method || 'GET') as any,
      data: options.data,
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'token': getToken(),
      },
      timeout: 30000,
      success: (res: any) => {
        if (options.showLoading) wx.hideLoading()
        if (res.statusCode === 401) {
          reject({ statusCode: 401, errMsg: 'Unauthorized' })
          return
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode}`))
          return
        }
        resolve(res.data as T)
      },
      fail: (err) => {
        if (options.showLoading) wx.hideLoading()
        reject(new Error(err.errMsg || '网络请求失败'))
      },
    })
  })
}

// ==================== 公开 API ====================

/** 拉当前活动（is_finished=False） */
export function fetchCurrentEvents(): Promise<EventItem[]> {
  return request<EventItem[]>({
    url: '/api/event/events/current/',
  })
}

/** 拉历史活动（is_finished=True） */
export function fetchHistoricalEvents(): Promise<EventItem[]> {
  return request<EventItem[]>({
    url: '/api/event/events/historical/',
  })
}

/** 拉活动详情 */
export function getEvent(eventId: number): Promise<EventItem> {
  return request<EventItem>({
    url: `/api/event/events/${eventId}/`,
    showLoading: true,
  })
}

/** 拉参与者列表 */
export function fetchParticipants(eventId: number): Promise<ParticipantItem[]> {
  return request<ParticipantItem[]>({
    url: `/api/event/participants/${eventId}/`,
    showLoading: true,
  })
}

/** 报名参加活动（普通用户） */
export function joinEvent(eventId: number): Promise<JoinEventResult> {
  return request<JoinEventResult>({
    url: '/api/event/participants/',
    method: 'POST',
    data: { event_id: eventId },
    showLoading: true,
    loadingText: '报名中...',
  })
}
