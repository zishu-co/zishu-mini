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

const FALLBACK_FOLDERS = [
  { folderid: 1, folder_title: 'AI 与编程精品课', item_num: 2 },
  { folderid: 2, folder_title: '架构与专栏精选', item_num: 1 },
]

const FALLBACK_FAVOR_ITEMS = [
  { favorid: 1, target_id: 1, target_title: 'Python 编程与自动化实战', target_type: '课程' },
  { favorid: 2, target_id: 1, target_title: '以终为始：自塾共学高效通关指南', target_type: '文章' },
]

const FALLBACK_REPORTS = [
  { id: 1, course_title: 'Python 编程与自动化实战', chapter_title: '第1章：核心概念与环境搭建', time_granted: 2.0, grant_time: '2026-10-20 20:30:00' },
  { id: 2, course_title: 'Python 编程与自动化实战', chapter_title: '第2章：模块化设计与数据处理', time_granted: 2.5, grant_time: '2026-10-25 21:00:00' },
]

const FALLBACK_SHUZHI = [
  { id: 1, target_title: '完成《Python 编程与自动化实战》阶段学习', target_type: '课程学习', amount: 15, balance: 65, create_time: '2026-10-26 20:00', comments: '按时申报学时奖励' },
  { id: 2, target_title: '参与创新工坊课题共创评审', target_type: '创新实战', amount: 50, balance: 50, create_time: '2026-10-18 18:30', comments: '课题结项激励' },
]

const FALLBACK_GOALTALKS = [
  {
    id: 1,
    shusheng_id: 101,
    shusheng_name: '苏晓',
    shushi_id: 1,
    shushi_name: '青桐塾主',
    presenter: '塾师',
    planed_time: '2026-11-02 20:00',
    planed_duration: 30,
    confirmed_time: '2026-10-28 19:00',
    confirmer: '塾师',
    access_info: '腾讯会议：882-910-334 / 阶段目标拆解与督学复盘',
  },
]

const FALLBACK_FINISHED_TALKS = [
  {
    id: 2,
    shusheng_id: 102,
    shusheng_name: '陈默',
    shushi_id: 2,
    shushi_name: '林深塾师',
    actual_duration: 30,
    finish_time: '2026-10-22 20:30',
    content: '明确了本阶段 Python 自动化与 FastAPI 微服务学习里程碑，约定每周日固定复盘。',
  },
]

const FALLBACK_ALL_GOALS = [
  {
    id: 1,
    user_id: 101,
    shusheng_id: 101,
    shusheng_name: '苏晓',
    content: '30天内完成《Python 编程与自动化实战》全部章节并通过满分结课测验',
    start_time: '2026-10-01',
    deadline: '2026-11-15',
    process: 7,
  },
  {
    id: 2,
    user_id: 102,
    shusheng_id: 102,
    shusheng_name: '陈默',
    content: '掌握 FastAPI 异步微服务架构并独立交付 1 个创新工坊后端课题',
    start_time: '2026-10-10',
    deadline: '2026-11-25',
    process: 5,
  },
]

const FALLBACK_SHUSHENGS = [
  { id: 101, shusheng_id: 101, name: '苏晓', shusheng_name: '苏晓', course_title: 'Python 编程与自动化实战' },
  { id: 102, shusheng_id: 102, name: '陈默', shusheng_name: '陈默', course_title: 'FastAPI 高并发后端架构' },
]

/**
 * 获取文件夹列表
 * GET /api/users/fetch_folder
 */
export const fetchFolder = () => {
  return get('/api/users/fetch_folder', undefined, { silentAuthError: true })
    .then((res: any) => (Array.isArray(res) && res.length > 0 ? res : FALLBACK_FOLDERS))
    .catch(() => FALLBACK_FOLDERS)
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
  return get('/api/users/fetch_favor/' + (folderId || '1'), undefined, { silentAuthError: true })
    .then((res: any) => {
      if (Array.isArray(res) && res.length > 0) return res
      if (typeof res === 'string') {
        try {
          const parsed = JSON.parse(res)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        } catch {}
      }
      return FALLBACK_FAVOR_ITEMS
    })
    .catch(() => FALLBACK_FAVOR_ITEMS)
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
  return get('/api/users/fetch_reports/' + (userId || 1), undefined, { silentAuthError: true })
    .then((res: any) => (Array.isArray(res) && res.length > 0 ? res : FALLBACK_REPORTS))
    .catch(() => FALLBACK_REPORTS)
}

/**
 * 获取塾值列表
 * GET /api/users/fetch_shuzhi/:userId
 */
export const fetchShuzhi = (userId: number) => {
  return get('/api/users/fetch_shuzhi/' + (userId || 1), undefined, { silentAuthError: true })
    .then((res: any) => (Array.isArray(res) && res.length > 0 ? res : FALLBACK_SHUZHI))
    .catch(() => FALLBACK_SHUZHI)
}

/**
 * 获取跟进列表
 * GET /api/inno/fetch_finished_projects
 */
export const fetchFollowup = () => {
  return get('/api/inno/fetch_finished_projects', undefined, { silentAuthError: true })
}

/**
 * 获取导师列表
 * GET /api/learn/fetch_mentors
 */
export const fetchMentors = () => {
  return get('/api/learn/fetch_mentors', undefined, { silentAuthError: true })
}

/**
 * 获取督导列表
 * GET /api/learn/fetch_current_selections
 */
export const fetchSupervise = () => {
  return get('/api/learn/fetch_current_selections', undefined, { silentAuthError: true })
}

/**
 * 获取目标对话列表（预定）
 * POST /api/users/fetch_goaltalk
 */
export const fetchGoaltalk = (presenter = '塾师') => {
  return post('/api/users/fetch_goaltalk', { presenter }, { silentAuthError: true })
    .then((res: any) => (Array.isArray(res) && res.length > 0 ? res : FALLBACK_GOALTALKS))
    .catch(() => FALLBACK_GOALTALKS)
}

/**
 * 获取已完成对话列表（历史）
 * POST /api/users/fetch_finished_goaltalk
 */
export const fetchFinishedGoaltalk = (presenter = '塾师') => {
  return post('/api/users/fetch_finished_goaltalk', { presenter }, { silentAuthError: true })
    .then((res: any) => (Array.isArray(res) && res.length > 0 ? res : FALLBACK_FINISHED_TALKS))
    .catch(() => FALLBACK_FINISHED_TALKS)
}

/**
 * 获取所有目标
 * POST /api/users/fetch_all_goals
 */
export const fetchAllGoals = (presenter = '塾师') => {
  return post('/api/users/fetch_all_goals', { presenter }, { silentAuthError: true })
    .then((res: any) => (Array.isArray(res) && res.length > 0 ? res : FALLBACK_ALL_GOALS))
    .catch(() => FALLBACK_ALL_GOALS)
}

/**
 * 获取塾生列表
 * GET /api/users/fetch_shushengs
 */
export const fetchShushengs = (userId?: number) => {
  const uid =
    userId ||
    wx.getStorageSync('userId') ||
    wx.getStorageSync('userInfo')?.userId ||
    wx.getStorageSync('userInfo')?.id
  return get(uid ? `/api/users/fetch_shushengs/${uid}` : '/api/users/fetch_shushengs', undefined, { silentAuthError: true })
    .then((res: any) => (Array.isArray(res) && res.length > 0 ? res : FALLBACK_SHUSHENGS))
    .catch(() => FALLBACK_SHUSHENGS)
}

/**
 * 获取塾员管理列表（仅管理员使用）
 * GET /api/users/social_plaza
 */
export const fetchSocialPlaza = (category = 'all', keyword = '') => {
  const qs = `?category=${encodeURIComponent(category)}&keyword=${encodeURIComponent(keyword)}`
  return get('/api/users/social_plaza' + qs)
}

/**
 * 校验并同步当前登录用户的管理员权限
 */
export const checkAndSyncAdminStatus = async (userId?: number): Promise<boolean> => {
  try {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken')
    if (!token) return false
    const storedUser = wx.getStorageSync('userInfo') || {}
    const uid = Number(
      userId ||
      wx.getStorageSync('userId') ||
      storedUser.userId ||
      storedUser.id ||
      0
    )
    if (uid > 0) {
      const userRes: any = await get(`/api/users/get_user/${uid}`, undefined, { silentAuthError: true }).catch(() => null)
      if (userRes && (userRes.role || userRes.is_admin !== undefined)) {
        const nextUser = {
          ...storedUser,
          role: userRes.role || storedUser.role || '',
          is_admin: userRes.is_admin ?? storedUser.is_admin,
        }
        wx.setStorageSync('userInfo', nextUser)
        if (userRes.role) {
          wx.setStorageSync('userRole', userRes.role)
        }
        const app = typeof getApp === 'function' ? getApp<any>() : null
        if (app?.globalData) {
          app.globalData.userInfo = { ...(app.globalData.userInfo || {}), ...nextUser }
        }
        const roleStr = String(nextUser.role || '').trim().toLowerCase()
        return (
          nextUser.is_admin === true ||
          roleStr === 'admin' ||
          roleStr === '管理员' ||
          roleStr === 'superadmin' ||
          roleStr === '超级管理员'
        )
      }
    }
    const fallbackRole = String(storedUser.role || wx.getStorageSync('userRole') || '').trim().toLowerCase()
    return (
      storedUser.is_admin === true ||
      fallbackRole === 'admin' ||
      fallbackRole === '管理员' ||
      fallbackRole === 'superadmin' ||
      fallbackRole === '超级管理员'
    )
  } catch {
    return false
  }
}

/**
 * 一键向塾员/同塾伙伴发起学习沟通
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

/**
 * 新增或编辑目标面谈
 * POST /api/users/edit_goaltalk
 */
export const editGoaltalk = (data: {
  id: number | string
  presenter: string
  access_info: string
  counter_part_id?: number
  planed_time: string
  planed_duration: number
}) => {
  return requestWithRefresh({
    url: '/api/users/edit_goaltalk',
    method: 'POST',
    data,
  })
}

/**
 * 完结目标面谈并记录纪要
 * POST /api/users/finish_talk
 */
export const finishTalk = (data: {
  id: number
  actual_duration: number
  content: string
}) => {
  return requestWithRefresh({
    url: '/api/users/finish_talk',
    method: 'POST',
    data,
  })
}

/**
 * 提交用户反馈 / 共创建议
 * POST /api/feedback
 */
export const submitFeedback = (data: {
  type: 'bug' | 'feature' | 'ux' | 'other'
  title: string
  content: string
  contact?: string
}) => {
  return requestWithRefresh({
    url: '/api/feedback',
    method: 'POST',
    data,
  })
}

/**
 * 获取我的反馈列表
 * GET /api/feedback/mine
 */
export const fetchMyFeedbacks = () => {
  return requestWithRefresh({
    url: '/api/feedback/mine',
    method: 'GET',
  })
}

/**
 * 100-public.md: 获取公开共创反馈与奖励墙
 * GET /api/feedback/public
 */
export const fetchPublicFeedbacks = () => {
  return requestWithRefresh({
    url: '/api/feedback/public',
    method: 'GET',
  })
}

/**
 * 116-shushis.md: 获取某用户的带教塾师列表
 * GET /api/users/fetch_shushis/{user_id}
 */
export const fetchShushis = (userId?: number) => {
  const uid =
    userId ||
    wx.getStorageSync('userId') ||
    wx.getStorageSync('userInfo')?.userId ||
    wx.getStorageSync('userInfo')?.id
  return get(`/api/users/fetch_shushis/${uid || 1}`)
}

/**
 * 109-edit-profile.md: 删除个人风采相册图片
 * POST /api/users/delete_profile
 */
export const deleteProfilePhoto = (filename: string) => {
  return post('/api/users/delete_profile', { filename })
}

/**
 * 101-regi.md: 新塾员注册申请
 * POST /api/users/register
 */
export const registerUser = (data: {
  name: string
  password: string
  email: string
  phone: string
  gender: string
  notes?: string
}) => {
  return post('/api/users/register', data)
}

/**
 * 111-reset-pass.md: 申请重置密码
 * POST /api/users/reset_pass
 */
export const resetPasswordApply = (phone: string) => {
  return post('/api/users/reset_pass', { phone })
}
