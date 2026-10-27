// @ts-nocheck
/**
 * services/user/user.ts
 * 用户与同路人社交相关 API
 */
import base from '../base'
const { get, post, requestWithRefresh } = base

/**
 * 修改密码
 * POST /api/users/handle_changepass
 * body: { name, newpass }
 */
export const changePass = (data: { name: string; newpass: string }) => {
  return post('/api/users/handle_changepass', data)
}

/**
 * 获取个人资料
 * GET /api/users/get_profile/{userid}
 */
export const getProfile = (params: { userid: number }) => {
  return get('/api/users/get_profile/' + params.userid)
}

/**
 * 提交个人资料
 * POST /api/users/submit_profile
 * body: { info: JSON.stringify({ name, gender, region, desc }) }
 */
export const submitProfile = (data: { info: string }) => {
  return post('/api/users/submit_profile', data)
}

/**
 * 获取文件夹列表
 * GET /api/users/fetch_folder
 */
export const fetchFolder = () => {
  return get('/api/users/fetch_folder')
}

/**
 * 新建收藏夹
 * POST /api/users/new_folder
 * body: { folder_name }
 */
export const newFolder = (folder_name: string) => {
  return post('/api/users/new_folder', { folder_name })
}

/**
 * 获取收藏列表
 * GET /api/users/fetch_favor/:folderId
 */
export const fetchFavor = (folderId: string) => {
  return get('/api/users/fetch_favor/' + folderId)
}

/**
 * 删除收藏
 * GET /api/users/delete_favor/:favorId
 */
export const deleteFavor = (favorId: number) => {
  return get('/api/users/delete_favor/' + favorId)
}

/**
 * 获取学习报告列表
 * GET /api/users/fetch_reports/:userId
 */
export const fetchReports = (userId: number) => {
  return get('/api/users/fetch_reports/' + userId)
}

/**
 * 获取塾值列表
 * GET /api/users/fetch_shuzhi/:userId
 */
export const fetchShuzhi = (userId: number) => {
  return get('/api/users/fetch_shuzhi/' + userId)
}

/**
 * 获取跟进列表
 * GET /api/users/fetch_followup
 */
export const fetchFollowup = () => {
  return get('/api/users/fetch_followup')
}

/**
 * 获取导师列表
 * GET /api/users/fetch_mentors
 */
export const fetchMentors = () => {
  return get('/api/users/fetch_mentors')
}

/**
 * 获取督导列表
 * GET /api/users/fetch_supervise
 */
export const fetchSupervise = () => {
  return get('/api/users/fetch_supervise')
}

/**
 * 获取目标对话列表（预定）
 * POST /api/users/fetch_goaltalk
 */
export const fetchGoaltalk = (presenter = '塾师') => {
  return post('/api/users/fetch_goaltalk', { presenter })
}

/**
 * 获取已完成对话列表（历史）
 * POST /api/users/fetch_finished_goaltalk
 */
export const fetchFinishedGoaltalk = (presenter = '塾师') => {
  return post('/api/users/fetch_finished_goaltalk', { presenter })
}

/**
 * 获取所有目标
 * POST /api/users/fetch_all_goals
 */
export const fetchAllGoals = (presenter = '塾师') => {
  return post('/api/users/fetch_all_goals', { presenter })
}

/**
 * 获取塾生列表
 * GET /api/users/fetch_shushengs
 */
export const fetchShushengs = () => {
  return get('/api/users/fetch_shushengs')
}

/**
 * 获取同路人交友广场列表
 * GET /api/users/social_plaza
 */
export const fetchSocialPlaza = (category = 'all', keyword = '') => {
  const qs = `?category=${encodeURIComponent(category)}&keyword=${encodeURIComponent(keyword)}`
  return get('/api/users/social_plaza' + qs)
}

/**
 * 一键向同路人/学伴发起破冰约聊
 * POST /api/users/quick_greet
 */
export const quickGreetPeer = (data: {
  target_user_id: number
  topic: string
  planed_time?: string
  planed_duration?: number
}) => {
  return requestWithRefresh({
    url: '/api/users/quick_greet',
    method: 'POST',
    data,
  })
}

/**
 * 预约塾师目标面谈
 * POST /api/users/confirm_reserve
 */
export const confirmReserveTalk = (data: {
  shushi_id: number
  planed_time: string
  planed_duration: number
}) => {
  return requestWithRefresh({
    url: '/api/users/confirm_reserve',
    method: 'POST',
    data,
  })
}

/**
 * 确认面谈安排
 * POST /api/users/confirm_talk
 */
export const confirmTalk = (data: { id: number; confirmer: string }) => {
  return requestWithRefresh({
    url: '/api/users/confirm_talk',
    method: 'POST',
    data,
  })
}
