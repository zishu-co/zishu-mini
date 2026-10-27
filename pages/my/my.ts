// @ts-nocheck

/**
 * pages/my/my.ts
 * 自塾小程序 - 我的页面
 * spec: specs/miniprogram/active/002-port-all-ark-into-my.md
 */

import { getUserArkList, ArkItem } from '../../services/learn/learn'
import { fetchCurrentSelections } from '../../services/course/course'
import { submitFeedback, fetchMyFeedbacks, fetchPublicFeedbacks } from '../../services/user/user'
import { getBaseUrl } from '../../services/base'

const _appMy = getApp<any>()

interface IMyPageData {
  userInfo: {
    userId?: number;
    avatarUrl: string;
    nickName: string;
    phoneNumber: string;
  };
  isLoggedIn: boolean;
  levelBadge: string;
  levelScore: number;
  levelProgressPercent: number;
  nextLevelHint: string;
  stats: {
    reportCount: number;
    shuzhiCount: number;
    courseCount: number;
    favCount: number;
  };
  /** 我的方舟列表（按创建时间倒序合并） */
  arkList: ArkItem[];
  arkLoading: boolean;
  arkCount: number;
}

Page<IMyPageData, any>({
  data: {
    userInfo: {
      userId: 0,
      avatarUrl: "",
      nickName: "",
      phoneNumber: "",
    },
    isLoggedIn: false,
    levelBadge: "🌱 LV.1 启航新星",
    levelScore: 0,
    levelProgressPercent: 15,
    nextLevelHint: "距 LV.2 进击塾生还差 20 分",
    stats: {
      reportCount: 0,
      shuzhiCount: 0,
      courseCount: 0,
      favCount: 0,
    },
    arkList: [],
    arkLoading: false,
    arkCount: 0,
    showFeedbackModal: false,
    feedbackTab: 'submit' as 'submit' | 'mine' | 'public',
    submittingFeedback: false,
    myFeedbacks: [] as any[],
    publicFeedbacks: [] as any[],
    feedbackForm: {
      type: 'feature' as 'bug' | 'feature' | 'ux' | 'other',
      title: '',
      content: '',
      contact: '',
    },
  },

  onLoad() {},

  onShow() {
    this.init()
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().init()
    }
  },

  onPullDownRefresh() {
    this.init()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 400)
  },

  onShareAppMessage() {
    const nickName = this.data.userInfo?.nickName || '自塾学友'
    return {
      title: `${nickName} 邀请你加入自塾 AI 英语共学，结伴闯关不孤单！`,
      path: '/pages/all/index',
    }
  },

  init() {
    const globalData = _appMy.globalData || {}
    const storedUserInfo = wx.getStorageSync('userInfo') || {}
    const storedPhoneNumber = wx.getStorageSync('phoneNumber') || ''
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken')
    const isLoggedIn = !!(
      globalData.hasUserInfo ||
      storedUserInfo?.nickName ||
      storedUserInfo?.name ||
      token
    )

    // 同步 storedUserInfo 到 globalData
    if (
      storedUserInfo &&
      Object.keys(storedUserInfo).length > 0 &&
      (!globalData.userInfo || Object.keys(globalData.userInfo).length === 0)
    ) {
      globalData.userInfo = storedUserInfo
      globalData.hasUserInfo = true
    }

    // 优先取 globalData，回退到 Storage
    const userInfo = globalData.userInfo && Object.keys(globalData.userInfo).length > 0
      ? globalData.userInfo
      : storedUserInfo
    const phoneNumber = globalData.phoneNumber || storedPhoneNumber

    const resolvedUserId = Number(
      userInfo.userId ||
      userInfo.id ||
      globalData.userId ||
      wx.getStorageSync('userId') ||
      0
    )

    this.setData({
      userInfo: {
        userId: resolvedUserId,
        avatarUrl: userInfo.avatarUrl || '',
        nickName: userInfo.nickName || userInfo.name || '',
        phoneNumber: phoneNumber,
      },
      isLoggedIn: isLoggedIn,
    })

    if (isLoggedIn) {
      this.fetchStats()
      this.fetchArks()
    }
  },

  refreshLevelBadge() {
    const { reportCount, shuzhiCount, courseCount } = this.data.stats
    const score = (reportCount || 0) * 5 + (shuzhiCount || 0) * 15 + (courseCount || 0) * 10 + (this.data.arkCount || 0) * 20
    let levelBadge = '🌱 LV.1 启航新星'
    let levelProgressPercent = 15
    let nextLevelHint = `距 LV.2 进击塾生还差 ${Math.max(20 - score, 1)} 分`
    if (score >= 120) {
      levelBadge = '👑 LV.4 领航塾师'
      levelProgressPercent = 100
      nextLevelHint = '已达成最高共学荣誉段位'
    } else if (score >= 60) {
      levelBadge = '🔥 LV.3 共学先锋'
      levelProgressPercent = Math.min(Math.round(((score - 60) / 60) * 100), 99)
      nextLevelHint = `距 LV.4 领航塾师还差 ${120 - score} 分`
    } else if (score >= 20) {
      levelBadge = '⚡ LV.2 进击塾生'
      levelProgressPercent = Math.min(Math.round(((score - 20) / 40) * 100), 99)
      nextLevelHint = `距 LV.3 共学先锋还差 ${60 - score} 分`
    } else {
      levelProgressPercent = Math.max(Math.round((score / 20) * 100), 10)
    }
    this.setData({
      levelBadge,
      levelScore: score,
      levelProgressPercent,
      nextLevelHint,
    })
  },

  /** 拉取我的方舟（按阶段分组，按时间倒序合并） */
  async fetchArks() {
    this.setData({ arkLoading: true })
    try {
      const res: any = await getUserArkList()
      if (res && typeof res === 'object') {
        // 4 个分组合并，按 create_time 倒序
        const all = [
          ...(res.sailing || []),
          ...(res.preparing || []),
          ...(res.finished || []),
          ...(res.closed || []),
        ]
        all.sort((a, b) => (b.create_time || '').localeCompare(a.create_time || ''))
        this.setData({
          arkList: all,
          arkCount: all.length,
        })
        this.refreshLevelBadge()
      }
    } catch (e) {
      console.error('[my] fetchArks error:', e)
      // 失败不阻塞页面，只是不显示方舟
    } finally {
      this.setData({ arkLoading: false })
    }
  },

  /** 点击方舟卡片 → 跳方舟详情 */
  onArkTap(e: any) {
    if (!this.data.isLoggedIn) {
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }
    const arkId = e.currentTarget.dataset.arkId
    if (!arkId) return
    wx.navigateTo({ url: `/pages/ark-detail/index?arkId=${arkId}` })
  },

  fetchStats() {
    const token = wx.getStorageSync("accessToken") || wx.getStorageSync("refreshToken")
    if (!token) return

    const storedUserInfo = wx.getStorageSync('userInfo') || {}
    const userId =
      _appMy.globalData?.userInfo?.userId ||
      _appMy.globalData?.userId ||
      storedUserInfo?.userId ||
      storedUserInfo?.id ||
      wx.getStorageSync('userId') ||
      0

    fetchCurrentSelections()
      .then((courses) => {
        if (Array.isArray(courses)) {
          const myCourses = userId
            ? courses.filter((c: any) => !c.user_id || Number(c.user_id) === Number(userId))
            : courses
          this.setData({ "stats.courseCount": myCourses.length || courses.length })
          this.refreshLevelBadge()
        }
      })
      .catch(() => {})

    wx.request({
      url: getBaseUrl() + "/api/users/fetch_folder",
      method: "GET",
      header: { token },
      success: (res: any) => {
        if (res.data && Array.isArray(res.data)) {
          this.setData({ "stats.favCount": res.data.length })
        }
      },
    })

    if (!userId) return

    wx.request({
      url: getBaseUrl() + "/api/users/fetch_reports/" + userId,
      method: "GET",
      header: { token },
      success: (res: any) => {
        if (res.data && Array.isArray(res.data)) {
          this.setData({ "stats.reportCount": res.data.length })
          this.refreshLevelBadge()
        }
      },
    })

    wx.request({
      url: getBaseUrl() + "/api/users/fetch_shuzhi/" + userId,
      method: "GET",
      header: { token },
      success: (res: any) => {
        if (res.data && Array.isArray(res.data)) {
          this.setData({ "stats.shuzhiCount": res.data.length })
          this.refreshLevelBadge()
        }
      },
    })
  },

  goToMyLearnSheet() {
    if (!this.data.isLoggedIn) {
      wx.navigateTo({ url: "/pages/login/login" })
      return
    }
    const uid = this.data.userInfo?.userId || wx.getStorageSync('userId') || 0
    if (!uid) {
      wx.switchTab({ url: "/pages/learn/index" })
      return
    }
    wx.navigateTo({ url: `/pages/learn-sheet/index?userId=${uid}` })
  },

  goToEditProfile() {
    if (!this.data.isLoggedIn) {
      wx.navigateTo({ url: "/pages/login/login" })
      return
    }
    wx.navigateTo({ url: "/pages/editprofile/index" })
  },

  onOpenFeedbackModal() {
    if (!this.data.isLoggedIn) {
      wx.navigateTo({ url: "/pages/login/login" })
      return
    }
    this.setData({
      showFeedbackModal: true,
      feedbackTab: 'submit',
    })
    this.loadMyFeedbacks()
    this.loadPublicFeedbacks()
  },

  onCloseFeedbackModal() {
    this.setData({ showFeedbackModal: false })
  },

  onSwitchFeedbackTab(e: any) {
    const tab = e.currentTarget.dataset.tab || 'submit'
    this.setData({ feedbackTab: tab })
    if (tab === 'mine') {
      this.loadMyFeedbacks()
    } else if (tab === 'public') {
      this.loadPublicFeedbacks()
    }
  },

  async loadPublicFeedbacks() {
    try {
      const res: any = await fetchPublicFeedbacks()
      const raw = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : []
      const list = raw.map((item: any) => ({
        ...item,
        _dateStr: item.create_time ? String(item.create_time).slice(0, 10) : '',
      }))
      this.setData({ publicFeedbacks: list })
    } catch {
      this.setData({ publicFeedbacks: [] })
    }
  },

  onSelectFeedbackType(e: any) {
    const type = e.currentTarget.dataset.type || 'feature'
    this.setData({ 'feedbackForm.type': type })
  },

  onFeedbackInput(e: any) {
    const field = e.currentTarget.dataset.field
    if (!field) return
    this.setData({ [`feedbackForm.${field}`]: e.detail.value })
  },

  async loadMyFeedbacks() {
    try {
      const res: any = await fetchMyFeedbacks()
      const raw = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : []
      const statusMap: Record<string, string> = {
        pending: '⏳ 待审核',
        reviewing: '🔍 评估中',
        accepted: '✨ 已采纳',
        completed: '🏆 已落地',
        rejected: '已归档',
      }
      const list = raw.map((item: any) => ({
        ...item,
        _statusText: statusMap[item.status] || '处理中',
        _dateStr: item.create_time ? String(item.create_time).slice(0, 10) : '',
      }))
      this.setData({ myFeedbacks: list })
    } catch {
      this.setData({ myFeedbacks: [] })
    }
  },

  async onSubmitFeedback() {
    if (this.data.submittingFeedback) return
    const { type, title, content, contact } = this.data.feedbackForm
    const cleanTitle = String(title || '').trim()
    const cleanContent = String(content || '').trim()
    if (!cleanTitle || !cleanContent) {
      wx.showToast({ title: '请填写反馈标题与详细描述', icon: 'none' })
      return
    }
    this.setData({ submittingFeedback: true })
    try {
      const res: any = await submitFeedback({
        type,
        title: cleanTitle,
        content: cleanContent,
        contact: String(contact || '').trim(),
      })
      if (res && (res.code === 200 || res.id)) {
        wx.showToast({ title: '🎉 感谢共创反馈！采纳后奖励塾值', icon: 'none' })
        this.setData({
          'feedbackForm.title': '',
          'feedbackForm.content': '',
          feedbackTab: 'mine',
        })
        await this.loadMyFeedbacks()
      } else {
        wx.showToast({ title: res?.msg || '反馈已提交', icon: 'none' })
        this.setData({ feedbackTab: 'mine' })
        await this.loadMyFeedbacks()
      }
    } catch {
      wx.showToast({ title: '提交失败，请稍后重试', icon: 'none' })
    } finally {
      this.setData({ submittingFeedback: false })
    }
  },

  navigateTo(e: any) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    if (!this.data.isLoggedIn) {
      wx.navigateTo({ url: "/pages/login/login" })
      return
    }
    wx.navigateTo({ url })
  },

  switchToTab(e: any) {
    const tab = e.currentTarget.dataset.tab
    if (!tab) return
    wx.switchTab({ url: tab })
  },

  /** 跳转到登录页 */
  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  logOut() {
    // 未登录时提示
    if (!this.data.isLoggedIn) {
      wx.showToast({ title: "未登录", icon: "none" })
      return
    }

    wx.showModal({
      title: "提示",
      content: "确定要退出登录吗？",
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userId')
          wx.clearStorageSync()
          _appMy.globalData.userInfo = null
          _appMy.globalData.hasUserInfo = false
          _appMy.globalData.phoneNumber = ""
          _appMy.globalData.hasPhoneNumber = false
          _appMy.globalData.accessToken = null
          _appMy.globalData.refreshToken = null

          this.setData({
            userInfo: { avatarUrl: "", nickName: "", phoneNumber: "" },
            isLoggedIn: false,
            stats: { reportCount: 0, shuzhiCount: 0, courseCount: 0, favCount: 0 },
            arkList: [],
            arkCount: 0,
          })

          wx.showToast({ title: "已退出登录", icon: "success" })

          setTimeout(() => {
            wx.navigateTo({ url: "/pages/login/login" })
          }, 1500)
        }
      },
    })
  },
})