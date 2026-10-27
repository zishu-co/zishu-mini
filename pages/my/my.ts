// @ts-nocheck

/**
 * pages/my/my.ts
 * 自塾小程序 - 我的页面
 * spec: specs/miniprogram/active/002-port-all-ark-into-my.md
 */

import { getUserArkList, ArkItem } from '../../services/learn/learn'
import { fetchCurrentSelections } from '../../services/course/course'
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
    stats: {
      reportCount: 0,
      shuzhiCount: 0,
      courseCount: 0,
      favCount: 0,
    },
    arkList: [],
    arkLoading: false,
    arkCount: 0,
  },

  onLoad() {},

  onShow() {
    this.init()
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().init()
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
    if (score >= 120) levelBadge = '👑 LV.4 领航塾师'
    else if (score >= 60) levelBadge = '🔥 LV.3 共学先锋'
    else if (score >= 20) levelBadge = '⚡ LV.2 进击塾生'
    this.setData({ levelBadge })
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