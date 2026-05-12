// @ts-nocheck

/**
 * pages/article/index.ts
 * 文章页面
 */

const app = getApp()

interface IArticlePageData {
  hasLogin: boolean
  loading: boolean
  articles: Array<{
    articleid: number
    title: string
    fulltext: string
    author_id: number
    author_name: string
    create_time?: string
  }>
}

Page<IArticlePageData, IArticlePageData>({
  data: {
    hasLogin: false,
    loading: false,
    articles: [],
  },

  onLoad() {
    this.checkLogin()
  },

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().init()
    }
    this.checkLogin()
  },

  checkLogin() {
    const storedUserInfo = wx.getStorageSync('userInfo')
    const storedPhoneNumber = wx.getStorageSync('phoneNumber')
    const hasLogin = !!(storedUserInfo || storedPhoneNumber)
    this.setData({ hasLogin })

    if (hasLogin) {
      this.fetchArticles()
    }
  },

  fetchArticles() {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken')
    if (!token) return

    this.setData({ loading: true })

    wx.request({
      url: 'https://zishu.co/api/article/index',
      method: 'GET',
      header: { token },
      success: (res: any) => {
        if (res.data && Array.isArray(res.data)) {
          const userId = app.globalData.userInfo?.userId || 0
          const userArticles = res.data.filter((a: any) => a.author_id === userId)
          this.setData({ articles: userArticles })
        } else {
          this.setData({ articles: [] })
        }
      },
      fail: () => {
        wx.showToast({ title: '加载失败', icon: 'none' })
      },
      complete: () => {
        this.setData({ loading: false })
      },
    })
  },

  onViewArticle(e: any) {
    const articleid = e.currentTarget.dataset.id
    if (!articleid) return
    wx.navigateTo({
      url: `/pages/article-detail/index?id=${articleid}`,
    })
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },
})
