/**
 * pages/my/my.ts
 * 自塾小程序 - 我的页面
 */

const app = getApp<any>()

interface IData {
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
}

Page<IData, IData>({
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
  },

  onLoad() {},

  onShow() {
    this.init()
    if (typeof this.getTabBar === "function") {
      this.getTabBar().init()
    }
  },

  init() {
    const globalData = app.globalData
    const userInfo = globalData.userInfo || {}
    const phoneNumber = globalData.phoneNumber || ""

    // 直接读取 storage 中的实际值判断是否已登录
    // 不依赖 hasUserInfo/hasPhoneNumber 标志（避免异步时序问题）
    const storedUserInfo = wx.getStorageSync('userInfo')
    const storedPhoneNumber = wx.getStorageSync('phoneNumber')
    const isLoggedIn = !!(storedUserInfo || storedPhoneNumber)

    this.setData({
      userInfo: {
        avatarUrl: userInfo.avatarUrl || "",
        nickName: userInfo.nickName || "",
        phoneNumber: phoneNumber,
      },
      isLoggedIn: isLoggedIn,
    })

    if (isLoggedIn) {
      this.fetchStats()
    }
  },

  fetchStats() {
    const token = wx.getStorageSync("accessToken") || wx.getStorageSync("refreshToken")
    if (!token) return

    const userId = app.globalData.userInfo?.userId || 0

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
    wx.navigateTo({ url: "/pages/editprofile/editprofile" })
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
    wx.showModal({
      title: "提示",
      content: "确定要退出登录吗？",
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          app.globalData.userInfo = null
          app.globalData.hasUserInfo = false
          app.globalData.phoneNumber = ""
          app.globalData.hasPhoneNumber = false
          app.globalData.accessToken = null
          app.globalData.refreshToken = null

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
