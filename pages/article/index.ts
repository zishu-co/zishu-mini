// @ts-nocheck

/**
 * pages/article/index.ts
 * 专栏文章页面
 */

const app = getApp()
import base, { getBaseUrl } from '../../services/base'
import { fetchArticleDetail } from '../../services/article/article'
import { fetchFolder, newFolder, quickGreetPeer } from '../../services/user/user'

interface IArticleItem {
  articleid: number
  title: string
  fulltext: string
  author_id: number
  author_name: string
  create_time?: string
  _preview?: string
  _wordCount?: number
  _readMins?: number
}

interface IReaderArticle {
  articleid: number
  title: string
  author_id?: number
  author_name: string
  bumen?: string
  create_time?: string
  content: string
  _wordCount?: number
  _readMins?: number
}

interface IArticlePageData {
  hasLogin: boolean
  loading: boolean
  allArticles: IArticleItem[]
  articles: IArticleItem[]
  articleTab: 'all' | 'mine' | 'zhuanlan'
  searchKeyword: string
  currentUserId: number
  showReaderModal: boolean
  readerLoading: boolean
  readerFontSize: 'sm' | 'md' | 'lg'
  currentArticle: IReaderArticle | null
  pendingArticleId: number
  // 103-list-zhuanlan.md & 101-zhuanlan.md: 专栏合集
  zhuanlanList: any[]
  activeZhuanlan: any | null
  zhuanlanArticles: any[]
  zhuanlanLoading: boolean
  // 102-edit.md: 写文章 / 编辑文章
  showEditorModal: boolean
  savingArticle: boolean
  editorForm: {
    id: number
    title: string
    content: string
  }
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
    allArticles: [],
    articles: [],
    articleTab: 'all',
    searchKeyword: '',
    currentUserId: 0,
    showReaderModal: false,
    readerLoading: false,
    readerFontSize: 'md',
    currentArticle: null,
    pendingArticleId: 0,
    zhuanlanList: [],
    activeZhuanlan: null,
    zhuanlanArticles: [],
    zhuanlanLoading: false,
    showEditorModal: false,
    savingArticle: false,
    editorForm: {
      id: 0,
      title: '',
      content: '',
    },
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

  onShareAppMessage() {
    const cur = this.data.currentArticle
    if (this.data.showReaderModal && cur && cur.articleid) {
      return {
        title: `📖 推荐阅读自塾专栏：《${cur.title}》`,
        path: `/pages/article/index?id=${cur.articleid}`,
      }
    }
    return {
      title: '自塾专栏精选 · 记录共学点滴，沉淀思考精华',
      path: '/pages/article/index',
    }
  },

  onSetFontSize(e: any) {
    const size = (e.currentTarget.dataset.size || 'md') as 'sm' | 'md' | 'lg'
    this.setData({ readerFontSize: size })
  },

  onCopyArticle() {
    const cur = this.data.currentArticle
    if (!cur || !cur.content) return
    const text = `《${cur.title}》\n作者：${cur.author_name || '自塾作者'}\n\n${cur.content}`
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '📋 已复制文章全文', icon: 'none' })
      },
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
      this.fetchZhuanlans()
    } else if (done) {
      done()
    }
  },

  fetchZhuanlans() {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || ''
    this.setData({ zhuanlanLoading: true })
    wx.request({
      url: `${getBaseUrl()}/api/article/showzhuanlan`,
      method: 'GET',
      header: { token, Authorization: token ? `Bearer ${token}` : '' },
      success: (res: any) => {
        if (Array.isArray(res.data)) {
          this.setData({ zhuanlanList: res.data })
        }
      },
      complete: () => {
        this.setData({ zhuanlanLoading: false })
      },
    })
  },

  onSelectZhuanlan(e: any) {
    const item = e.currentTarget.dataset.item
    const zhuanlanid = Number(item?.zhuanlanid || e.currentTarget.dataset.id || 0)
    if (!zhuanlanid) return
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || ''
    this.setData({ zhuanlanLoading: true, activeZhuanlan: item })
    wx.request({
      url: `${getBaseUrl()}/api/article/zhuanlan/${zhuanlanid}`,
      method: 'GET',
      header: { token, Authorization: token ? `Bearer ${token}` : '' },
      success: (res: any) => {
        const zdata = Array.isArray(res.data?.zdata) ? res.data.zdata : []
        this.setData({
          zhuanlanArticles: zdata,
          activeZhuanlan: res.data?.zl || item,
        })
      },
      complete: () => {
        this.setData({ zhuanlanLoading: false })
      },
    })
  },

  onBackToZhuanlanList() {
    this.setData({ activeZhuanlan: null, zhuanlanArticles: [] })
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
          const userId = Number(
            wx.getStorageSync('userId') ||
              storedUserInfo?.userId ||
              storedUserInfo?.id ||
              app.globalData?.userInfo?.userId ||
              app.globalData?.userInfo?.id ||
              0
          )
          const allFormatted: IArticleItem[] = res.data.map((a: any) => {
            const preview = stripHtmlTags(a.fulltext || '')
            const wordCount = Math.max(10, preview.replace(/\s+/g, '').length)
            const readMins = Math.max(1, Math.ceil(wordCount / 300))
            return {
              ...a,
              _preview: preview,
              _wordCount: wordCount,
              _readMins: readMins,
            }
          })
          this.setData({
            allArticles: allFormatted,
            currentUserId: userId,
          })
          this.applyArticleFilter(this.data.articleTab, this.data.searchKeyword, allFormatted, userId)

          if (this.data.pendingArticleId > 0) {
            const targetId = this.data.pendingArticleId
            this.setData({ pendingArticleId: 0 })
            this.openArticleReader(targetId)
          }
        } else {
          this.setData({ allArticles: [], articles: [] })
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
    const fallbackItem = (this.data.allArticles.length ? this.data.allArticles : this.data.articles).find(
      (item: IArticleItem) => Number(item.articleid) === Number(articleid)
    )
    this.setData({
      showReaderModal: true,
      readerLoading: true,
      currentArticle: fallbackItem
        ? {
            articleid: fallbackItem.articleid,
            title: fallbackItem.title,
            author_id: fallbackItem.author_id,
            author_name: fallbackItem.author_name,
            create_time: fallbackItem.create_time || '',
            content: fallbackItem._preview || stripHtmlTags(fallbackItem.fulltext || ''),
          }
        : null,
    })

    this.fetchArticleFulltext(Number(articleid)).then((article) => {
      const wordCount = Math.max(10, String(article.content || '').replace(/\s+/g, '').length)
      const readMins = Math.max(1, Math.ceil(wordCount / 300))
      this.setData({
        currentArticle: {
          ...article,
          author_id: article.author_id || fallbackItem?.author_id,
          _wordCount: wordCount,
          _readMins: readMins,
        },
        readerLoading: false,
      })
    })
  },

  applyArticleFilter(
    tab: 'all' | 'mine' | 'zhuanlan',
    keyword: string,
    sourceList = this.data.allArticles,
    uid = this.data.currentUserId
  ) {
    if (tab === 'zhuanlan') {
      this.setData({
        articleTab: 'zhuanlan',
        searchKeyword: keyword,
      })
      if (!this.data.zhuanlanList.length) {
        this.fetchZhuanlans()
      }
      return
    }
    const kw = (keyword || '').trim().toLowerCase()
    const articles = (sourceList || []).filter((a: IArticleItem) => {
      if (tab === 'mine' && uid && Number(a.author_id) !== Number(uid)) {
        return false
      }
      if (!kw) return true
      const title = String(a.title || '').toLowerCase()
      const author = String(a.author_name || '').toLowerCase()
      const preview = String(a._preview || '').toLowerCase()
      return title.includes(kw) || author.includes(kw) || preview.includes(kw)
    })
    this.setData({
      articleTab: tab,
      searchKeyword: keyword,
      articles,
    })
  },

  onTabChange(e: any) {
    const tab = (e.currentTarget.dataset.tab || 'all') as 'all' | 'mine' | 'zhuanlan'
    if (tab === this.data.articleTab) return
    this.applyArticleFilter(tab, this.data.searchKeyword)
  },

  // ── 102-edit.md: 写文章 / 编辑文章 / 删除文章 ──────────────────
  onOpenCreateArticle() {
    if (!this.data.hasLogin) {
      this.goToLogin()
      return
    }
    this.setData({
      showEditorModal: true,
      editorForm: {
        id: 0,
        title: '',
        content: '',
      },
    })
  },

  onOpenEditArticle() {
    const cur = this.data.currentArticle
    if (!cur || !cur.articleid) return
    this.setData({
      showReaderModal: false,
      showEditorModal: true,
      editorForm: {
        id: Number(cur.articleid),
        title: cur.title || '',
        content: cur.content || '',
      },
    })
  },

  onCloseEditorModal() {
    this.setData({ showEditorModal: false })
  },

  onEditorInput(e: any) {
    const field = e.currentTarget.dataset.field
    if (!field) return
    this.setData({
      [`editorForm.${field}`]: e.detail.value,
    })
  },

  async onSaveArticle() {
    const { id, title, content } = this.data.editorForm
    if (!String(title || '').trim()) {
      wx.showToast({ title: '请输入文章标题', icon: 'none' })
      return
    }
    if (!String(content || '').trim()) {
      wx.showToast({ title: '请输入文章正文内容', icon: 'none' })
      return
    }
    this.setData({ savingArticle: true })
    try {
      const res: any = await base.post('/api/article/save', {
        id: Number(id || 0),
        title: String(title).trim(),
        content: String(content).trim(),
      })
      if (res && (res.result !== undefined || res.code === 200)) {
        wx.showToast({ title: id > 0 ? '文章更新成功 ✨' : '文章发布成功 🎉', icon: 'success' })
        this.setData({ showEditorModal: false })
        this.fetchArticles()
      } else {
        wx.showToast({ title: res?.msg || '保存失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '保存失败，请稍后重试', icon: 'none' })
    } finally {
      this.setData({ savingArticle: false })
    }
  },

  async onDeleteArticle() {
    const cur = this.data.currentArticle
    if (!cur || !cur.articleid) return
    wx.showModal({
      title: '删除文章',
      content: `确定删除《${cur.title}》吗？`,
      confirmColor: '#ef4444',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await base.post('/api/article/delete', { id: Number(cur.articleid) })
          wx.showToast({ title: '已删除', icon: 'success' })
          this.setData({ showReaderModal: false })
          this.fetchArticles()
        } catch (err) {
          wx.showToast({ title: '删除失败', icon: 'none' })
        }
      },
    })
  },

  onSearchInput(e: any) {
    const kw = e.detail.value || ''
    this.applyArticleFilter(this.data.articleTab, kw)
  },

  onClearSearch() {
    this.applyArticleFilter(this.data.articleTab, '')
  },

  async onFavorArticle() {
    const cur = this.data.currentArticle
    if (!cur || !cur.articleid) return
    try {
      let folders: any[] = (await fetchFolder().catch(() => [])) || []
      if (!Array.isArray(folders) || folders.length === 0) {
        const created: any = await newFolder('精选专栏')
        folders = [{ folderid: created?.newfid || 1, folder_title: '精选专栏', selected: true }]
      } else {
        folders = folders.map((f: any, idx: number) => ({
          ...f,
          selected: idx === 0,
        }))
      }
      await base.post('/api/users/add_favor', {
        target_id: cur.articleid,
        target_type: '文章',
        folderlist: JSON.stringify(folders),
      })
      wx.showToast({ title: `⭐ 已收藏至「${folders[0].folder_title || '收藏夹'}」`, icon: 'none' })
    } catch (err) {
      wx.showToast({ title: '收藏失败，请稍后重试', icon: 'none' })
    }
  },

  async onGreetAuthor() {
    const cur = this.data.currentArticle
    if (!cur) return
    const authorName = cur.author_name || '专栏作者'
    const authorId = Number(cur.author_id || 0)
    if (authorId) {
      try {
        await quickGreetPeer({
          target_user_id: authorId,
          topic: `📖 拜读专栏《${cur.title}》· 15分钟共学交流`,
          planed_duration: 15,
        })
      } catch (err) {
        // ignore
      }
    }
    wx.showToast({ title: `👋 已向作者 ${authorName} 发送交流邀约`, icon: 'none' })
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
