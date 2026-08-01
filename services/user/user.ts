// @ts-nocheck
/**
 * services/user/user.ts
 * 用户相关 API
 */
import base from '../base'
const { get, post } = base

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
 * body: { info: JSON.stringify({ name, gender, region, desc, goal }) }
 * 注意：后端要求 application/json，不能用默认的 x-www-form-urlencoded
 */
export const submitProfile = (data: { info: string }) => {
  return post('/api/users/submit_profile', data, {
    header: { 'content-type': 'application/json' },
  })
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
 * GET /api/users/fetch_goaltalk?presenter=塾师
 */
export const fetchGoaltalk = () => {
  return post('/api/users/fetch_goaltalk', { presenter: '塾师' })
}

/**
 * 获取已完成对话列表（历史）
 * GET /api/users/fetch_finished_goaltalk?presenter=塾师
 */
export const fetchFinishedGoaltalk = () => {
  return post('/api/users/fetch_finished_goaltalk', { presenter: '塾师' })
}

/**
 * 获取所有目标
 * GET /api/users/fetch_all_goals?presenter=塾师
 */
export const fetchAllGoals = () => {
  return post('/api/users/fetch_all_goals', { presenter: '塾师' })
}

/**
 * 获取塾生列表
 * GET /api/users/fetch_shushengs
 */
export const fetchShushengs = () => {
  return get('/api/users/fetch_shushengs')
}

/**
 * 小程序注册（v2 改造：token_miniprogram 返回"用户不存在"时调用）
 * POST /api/users/regi_miniprogram
 * body: { sessionkey, miniProgramToken, name, email, gender }
 */
export const regiMiniProgram = (data: {
  sessionkey: string
  miniProgramToken: string
  name: string
  email: string
  gender: '男' | '女'
}) => {
  return post('/api/users/regi_miniprogram', data)
}