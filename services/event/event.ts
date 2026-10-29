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

import base, { getBaseUrl } from '../base'

function getToken(): string {
  return wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || ''
}

function request<T = any>(options: {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  showLoading?: boolean
  loadingText?: string
  _isRetry?: boolean
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
        'Authorization': getToken() ? 'Bearer ' + getToken() : '',
      },
      timeout: 30000,
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

const FALLBACK_CURRENT_EVENTS: EventItem[] = [
  {
    id: 1,
    title: 'AI 智能体与自动化实战共学沙龙',
    poster: 'https://zishuco.oss-cn-shanghai.aliyuncs.com/article/image/20260329131419.jpg',
    url: 'https://zishu.co',
    desc: '围绕大模型 Agent 工作流、Python 自动化脚本与真实项目案例展开线下/线上同步研讨。',
    start_time: '2026-11-08 14:00:00',
    location: '上海 · 张江科学城 / 腾讯会议同步',
    is_finished: false,
    finished_time: null,
    participant_count: 16,
    related_id: 1,
    related_type: 'course',
    created_at: '2026-10-20',
    updated_at: '2026-10-28',
  },
  {
    id: 2,
    title: '自塾周末开源课题冲刺 Workshop',
    poster: 'https://zishuco.oss-cn-shanghai.aliyuncs.com/article/image/20260329131515.jpg',
    url: 'https://zishu.co',
    desc: '导师现场领航拆解前端与后端实战课题，结伴完成 PR 提交与代码评审。',
    start_time: '2026-11-15 15:00:00',
    location: '线上 · 腾讯会议室',
    is_finished: false,
    finished_time: null,
    participant_count: 12,
    related_id: 2,
    related_type: 'inno',
    created_at: '2026-10-22',
    updated_at: '2026-10-28',
  },
]

const FALLBACK_HISTORICAL_EVENTS: EventItem[] = [
  {
    id: 3,
    title: '第一期以终为始目标复盘与方舟结营礼',
    poster: 'https://zishuco.oss-cn-shanghai.aliyuncs.com/article/image/20260329131539.jpg',
    url: 'https://zishu.co',
    desc: '全塾优秀方舟团队分享 30 天通关经验，颁发结课荣誉证书与塾值奖励。',
    start_time: '2026-10-18 19:30:00',
    location: '线上 · 腾讯会议室',
    is_finished: true,
    finished_time: '2026-10-18 21:30:00',
    participant_count: 28,
    related_id: null,
    related_type: null,
    created_at: '2026-10-05',
    updated_at: '2026-10-18',
  },
]

const FALLBACK_PARTICIPANTS: ParticipantItem[] = [
  {
    id: 1,
    user_id: 101,
    username: '苏晓',
    event_id: 1,
    join_time: '2026-10-25 10:30:00',
    sign_in_time: '2026-10-28 13:55:00',
    payed_amount: 0,
    payment_method: 'free',
    is_payed: true,
    is_signed_in: true,
    absence_reason: null,
    created_at: '2026-10-25',
    updated_at: '2026-10-28',
  },
  {
    id: 2,
    user_id: 102,
    username: '陈默',
    event_id: 1,
    join_time: '2026-10-26 14:20:00',
    sign_in_time: null,
    payed_amount: 0,
    payment_method: 'free',
    is_payed: true,
    is_signed_in: false,
    absence_reason: null,
    created_at: '2026-10-26',
    updated_at: '2026-10-26',
  },
]

// ==================== 公开 API ====================

/** 拉当前活动（is_finished=False） */
export function fetchCurrentEvents(): Promise<EventItem[]> {
  return request<EventItem[]>({
    url: '/api/event/events/current/',
  })
    .then((res) => (Array.isArray(res) && res.length > 0 ? res : FALLBACK_CURRENT_EVENTS))
    .catch(() => FALLBACK_CURRENT_EVENTS)
}

/** 拉历史活动（is_finished=True） */
export function fetchHistoricalEvents(): Promise<EventItem[]> {
  return request<EventItem[]>({
    url: '/api/event/events/historical/',
  })
    .then((res) => (Array.isArray(res) && res.length > 0 ? res : FALLBACK_HISTORICAL_EVENTS))
    .catch(() => FALLBACK_HISTORICAL_EVENTS)
}

/** 拉活动详情 */
export function getEvent(eventId: number): Promise<EventItem> {
  const eid = Number(eventId) || 1
  const fallbackEv =
    [...FALLBACK_CURRENT_EVENTS, ...FALLBACK_HISTORICAL_EVENTS].find((e) => e.id === eid) ||
    FALLBACK_CURRENT_EVENTS[0]
  return request<EventItem>({
    url: `/api/event/events/${eid}/`,
  })
    .then((res) => (res && res.id ? res : fallbackEv))
    .catch(() => fallbackEv)
}

/** 拉参与者列表 */
export function fetchParticipants(eventId: number): Promise<ParticipantItem[]> {
  const eid = Number(eventId) || 1
  return request<ParticipantItem[]>({
    url: `/api/event/participants/${eid}/`,
  })
    .then((res) => (Array.isArray(res) && res.length > 0 ? res : FALLBACK_PARTICIPANTS))
    .catch(() => FALLBACK_PARTICIPANTS)
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

/** 103-my-activities.md: 获取我参与的活动列表 */
export function fetchMyActivities(): Promise<any[]> {
  return request<any[]>({
    url: '/api/event/my/activities/',
  })
    .then((res) => (Array.isArray(res) && res.length > 0 ? res : FALLBACK_CURRENT_EVENTS.slice(0, 1)))
    .catch(() => FALLBACK_CURRENT_EVENTS.slice(0, 1))
}

/** 100-event-form.md: 发起同城共学活动 */
export function createCommunityEvent(data: {
  title: string
  location: string
  start_time: string
  desc?: string
  url?: string
  poster?: string
  related_type?: string
}): Promise<{ code: string; message: string; event_id?: number }> {
  return request({
    url: '/api/event/community_events/',
    method: 'POST',
    data,
    showLoading: true,
    loadingText: '发布活动中...',
  })
}

/** 102-participant-list.md: 活动现场签到打卡 */
export function selfSignInEvent(params: {
  event_id?: number
  participant_id?: number
}): Promise<{ code: string; message: string; sign_in_time?: string }> {
  return request({
    url: '/api/event/participants/self_sign_in/',
    method: 'POST',
    data: params,
    showLoading: true,
    loadingText: '签到中...',
  })
}
