// @ts-nocheck

/**
 * pages/my/my.ts
 * 自塾小程序 - 我的页面
 * spec: specs/miniprogram/active/002-port-all-ark-into-my.md
 */

import { getUserArkList, ArkItem } from '../../services/learn/learn'

const _appMy = getApp<any>()

interface IMyPageData {
  userInfo: {
    avatarUrl: string;
    nickName: string;
    phoneNumber: string;
  };
  isLoggedIn: boolean;
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

Page<IMyPageData, IMyPageData>({
  data: {
    userInfo: {
      avatarUrl: "",
      nickName: "",
      phoneNumber: "",
    },
    isLoggedIn: false,
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
    if (typeof this.getTabBar === "function") {
      this.getTabBar().init()
    }
  },

  init() {
    const globalData = _appMy.globalData
    const storedUserInfo = wx.getStorageSync('userInfo') || {}
    const storedPhoneNumber = wx.getStorageSync('phoneNumber') || ''
    const isLoggedIn = !!(storedUserInfo || storedPhoneNumber)

    // 优先取 globalData，回退到 Storage
    const userInfo = globalData.userInfo && Object.keys(globalData.userInfo).length > 0
      ? globalData.userInfo
      : storedUserInfo
    const phoneNumber = globalData.phoneNumber || storedPhoneNumber

    this.setData({
      userInfo: {
        avatarUrl: userInfo.avatarUrl || '',
        nickName: userInfo.nickName || '',
        phoneNumber: phoneNumber,
      },
      isLoggedIn: isLoggedIn,
    })

    if (isLoggedIn) {
      this.fetchStats()
      this.fetchArks()
    }
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
      }
    } catch (e) {
      console.error('[my] fetchArks error:', e)
      // 失败不阻塞页面，只是不显示方舟
    } finally {
      this.setData({ arkLoading: false })
    }
  },

  /** 点击方舟卡片 → 跳方舟详情（暂跳 learn/index，B1/B2 完善后跳 detail） */
  onArkTap(e: any) {
    if (!this.data.isLoggedIn) {
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }
    // B1/B2 阶段会改成 wx.navigateTo 到独立 detail 页
    wx.switchTab({ url: '/pages/learn/index' })
  },

  fetchStats() {
    const token = wx.getStorageSync("accessToken") || wx.getStorageSync("refreshToken")
    if (!token) return

    const userId = _appMy.globalData.userInfo?.userId || 0

    wx.request({
      url: "https://zishu.co/api/users/fetch_reports/" + userId,
      method: "GET",
      header: { token },
      success: (res: any) => {
        if (res.data && Array.isArray(res.data)) {
          this.setData({ "stats.reportCount": res.data.length })
        }
      },
    })

    wx.request({
      url: "https://zishu.co/api/users/fetch_shuzhi/" + userId,
      method: "GET",
      header: { token },
      success: (res: any) => {
        if (res.data && Array.isArray(res.data)) {
          this.setData({ "stats.shuzhiCount": res.data.length })
        }
      },
    })
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