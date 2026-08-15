/**
 * 活动 API 服务
 * 对接后端 /api/event/* 接口
 * spec: specs/port/archive/006-port-event-list.md
 *      specs/port/archive/007-port-event-participants.md
 */
import base from '../base'

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

/**
 * 统一请求封装
 * 复用 services/base.ts 的双 Token 无感刷新机制：
 * - accessToken 过期（后端返回 401 + detail.code 5000）时，自动用 refreshToken 刷新并重试原请求
 * - 刷新失败（refreshToken 也失效）时，自动清除登录态并跳转登录页
 */
function request<T = any>(options: {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  showLoading?: boolean
  loadingText?: string
}): Promise<T> {
  return base.requestWithRefresh(options) as Promise<T>
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
