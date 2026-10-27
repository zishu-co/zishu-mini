// @ts-nocheck

/**
 * pages/article/index.ts
 * 专栏文章页面
 */

const app = getApp()
import { getBaseUrl } from '../../services/base'
import { fetchArticleDetail } from '../../services/article/article'

interface IArticleItem {
  articleid: number
  title: string
  fulltext: string
  author_id: number
  author_name: string
  create_time?: string
  _preview?: string
}

interface IReaderArticle {
  articleid: number
  title: string
  author_name: string
  bumen?: string
  create_time?: string
  content: string
}

interface IArticlePageData {
  hasLogin: boolean
  loading: boolean
  articles: IArticleItem[]
  showReaderModal: boolean
  readerLoading: boolean
  currentArticle: IReaderArticle | null
  pendingArticleId: number
}

function stripHtmlTags(input: string): string {
  if (!input) return ''
  return String(input)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

Page<IArticlePageData, any>({
  data: {
    hasLogin: false,
    loading: false,
    articles: [],
    showReaderModal: false,
    readerLoading: false,
    currentArticle: null,
    pendingArticleId: 0,
  },

  onLoad(options?: any) {
    wx.setNavigationBarTitle({ title: '专栏文章' })
    if (options && options.id) {
      const id = Number(options.id)
      if (id > 0) {
        this.setData({ pendingArticleId: id })
      }
    }
    this.checkLogin()
  },

  onShow() {
    this.checkLogin()
  },

  onPullDownRefresh() {
    this.checkLogin(() => {
      wx.stopPullDownRefresh()
    })
  },

  checkLogin(done?: () => void) {
    const storedUserInfo = wx.getStorageSync('userInfo')
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken')
    const userId = wx.getStorageSync('userId') || storedUserInfo?.userId || storedUserInfo?.id
    const hasLogin = !!(
      token ||
      userId ||
      (storedUserInfo && (storedUserInfo.nickName || storedUserInfo.username || storedUserInfo.name))
    )
    this.setData({ hasLogin })

    if (hasLogin) {
      this.fetchArticles(done)
    } else if (done) {
      done()
    }
  },

  fetchArticles(done?: () => void) {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken')
    if (!token) {
      if (done) done()
      return
    }

    this.setData({ loading: true })

    wx.request({
      url: getBaseUrl() + '/api/article/index',
      method: 'GET',
      header: { token },
      success: (res: any) => {
        if (res.data && Array.isArray(res.data)) {
          const storedUserInfo = wx.getStorageSync('userInfo')
          const userId =
            wx.getStorageSync('userId') ||
            storedUserInfo?.userId ||
            storedUserInfo?.id ||
            app.globalData?.userInfo?.userId ||
            app.globalData?.userInfo?.id ||
            0
          const allFormatted: IArticleItem[] = res.data.map((a: any) => ({
            ...a,
            _preview: stripHtmlTags(a.fulltext || ''),
          }))
          const filtered = userId
            ? allFormatted.filter((a: any) => Number(a.author_id) === Number(userId))
            : allFormatted
          const articles = filtered.length > 0 ? filtered : allFormatted
          this.setData({ articles })

          if (this.data.pendingArticleId > 0) {
            const targetId = this.data.pendingArticleId
            this.setData({ pendingArticleId: 0 })
            this.openArticleReader(targetId)
          }
        } else {
          this.setData({ articles: [] })
        }
      },
      fail: () => {
        wx.showToast({ title: '加载失败', icon: 'none' })
      },
      complete: () => {
        this.setData({ loading: false })
        if (done) done()
      },
    })
  },

  fetchArticleFulltext(articleid: number): Promise<IReaderArticle> {
    const fallbackItem = this.data.articles.find(
      (item: IArticleItem) => Number(item.articleid) === Number(articleid)
    )
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || ''

    return fetchArticleDetail(Number(articleid))
      .then((detail: any) => {
        if (detail && (detail.varticle || detail.fulltext || detail.title)) {
          return {
            articleid: Number(detail.articleid || articleid),
            title: detail.title || fallbackItem?.title || '文章详情',
            author_name: detail.author_name || fallbackItem?.author_name || '自塾作者',
            bumen: detail.bumen || '',
            create_time: detail.create_time || fallbackItem?.create_time || '',
            content: stripHtmlTags(detail.varticle || detail.fulltext || fallbackItem?.fulltext || ''),
          }
        }
        return new Promise<IReaderArticle>((resolve) => {
          wx.request({
            url: `${getBaseUrl()}/api/article/fulltext/${articleid}`,
            method: 'GET',
            header: { token },
            success: (res: any) => {
              const d = res.data || {}
              resolve({
                articleid: Number(articleid),
                title: d.title || fallbackItem?.title || '文章详情',
                author_name: d.author_name || fallbackItem?.author_name || '自塾作者',
                bumen: d.bumen || '',
                create_time: d.create_time || fallbackItem?.create_time || '',
                content: stripHtmlTags(d.fulltext || d.varticle || d.content || fallbackItem?.fulltext || '暂无正文内容'),
              })
            },
            fail: () => {
              resolve({
                articleid: Number(articleid),
                title: fallbackItem?.title || '文章详情',
                author_name: fallbackItem?.author_name || '自塾作者',
                create_time: fallbackItem?.create_time || '',
                content: stripHtmlTags(fallbackItem?.fulltext || '暂无正文内容'),
              })
            },
          })
        })
      })
      .catch(() => ({
        articleid: Number(articleid),
        title: fallbackItem?.title || '文章详情',
        author_name: fallbackItem?.author_name || '自塾作者',
        create_time: fallbackItem?.create_time || '',
        content: stripHtmlTags(fallbackItem?.fulltext || '暂无正文内容'),
      }))
  },

  openArticleReader(articleid: number) {
    const fallbackItem = this.data.articles.find(
      (item: IArticleItem) => Number(item.articleid) === Number(articleid)
    )
    this.setData({
      showReaderModal: true,
      readerLoading: true,
      currentArticle: fallbackItem
        ? {
            articleid: fallbackItem.articleid,
            title: fallbackItem.title,
            author_name: fallbackItem.author_name,
            create_time: fallbackItem.create_time || '',
            content: fallbackItem._preview || stripHtmlTags(fallbackItem.fulltext || ''),
          }
        : null,
    })

    this.fetchArticleFulltext(Number(articleid)).then((article) => {
      this.setData({
        currentArticle: article,
        readerLoading: false,
      })
    })
  },

  onViewArticle(e: any) {
    const articleid = Number(e.currentTarget.dataset.id)
    if (!articleid) return
    this.openArticleReader(articleid)
  },

  closeArticleModal() {
    this.setData({
      showReaderModal: false,
      readerLoading: false,
    })
  },

  stopReaderBubble() {
    return false
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },
})
