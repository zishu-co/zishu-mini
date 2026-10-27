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
  articleTab: 'all' | 'mine' | 'zhuanlan' | 'video' | 'map'
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
  // 104-show-album.md, 103-fetch-album.md, 105-watch-video.md: 微课视频专辑
  videoAlbums: any[]
  activeAlbum: any | null
  albumVideos: any[]
  videoLoading: boolean
  showVideoModal: boolean
  currentVideo: any | null
  // 103-show-maps.md, 101-map.md, 102-search-map.md: 知识脑图
  mapList: any[]
  activeMap: any | null
  activeMapNodes: any[]
  mapLoading: boolean
  mapSearchQuery: string
  mapSearchResults: any[]
  // 102-edit.md: 写文章 / 编辑文章
  showEditorModal: boolean
  savingArticle: boolean
  editorForm: {
    id: number
    title: string
    content: string
  }
}

function flattenMindMapNodes(raw: any, depth = 0, out: any[] = []): any[] {
  if (!raw) return out
  const list = Array.isArray(raw) ? raw : [raw]
  for (const node of list) {
    if (!node || typeof node !== 'object') continue
    const name = String(node.name || node.title || node.topic || node.text || '').trim()
    const children = Array.isArray(node.children) ? node.children : []
    if (name) {
      out.push({
        id: `${depth}-${out.length}`,
        name,
        depth,
        indentStyle: `padding-left: ${Math.min(depth * 28, 140)}rpx;`,
        childrenCount: children.length,
        note: String(node.note || node.remark || node.desc || '').trim(),
      })
    }
    if (children.length > 0) {
      flattenMindMapNodes(children, depth + 1, out)
    }
  }
  return out
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
    videoAlbums: [],
    activeAlbum: null,
    albumVideos: [],
    videoLoading: false,
    showVideoModal: false,
    currentVideo: null,
    mapList: [],
    activeMap: null,
    activeMapNodes: [],
    mapLoading: false,
    mapSearchQuery: '',
    mapSearchResults: [],
    showEditorModal: false,
    savingArticle: false,
    editorForm: {
      id: 0,
      title: '',
      content: '',
    },
    showZhuanlanModal: false,
    savingZhuanlan: false,
    zhuanlanForm: {
      zhuanlan_title: '',
      first_article_id: 0,
      first_part: '第一篇',
    },
    showCreateVideoModal: false,
    savingVideo: false,
    videoForm: {
      album_title: '',
      video_title: '',
      video_desc: '',
      video_length: 15,
      video_websrc: '',
      video_fulltext: '',
    },
    showCreateMapModal: false,
    savingMap: false,
    mapForm: {
      map_title: '',
      map_desc: '',
      root_topic: '',
      children_topics: '',
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
      this.fetchVideoAlbums()
      this.fetchMindMaps()
    } else if (done) {
      done()
    }
  },

  // ── 104-show-album.md, 103-fetch-album.md, 105-watch-video.md: 微课专辑 ──
  fetchVideoAlbums() {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || ''
    this.setData({ videoLoading: true })
    wx.request({
      url: `${getBaseUrl()}/api/video/show_album`,
      method: 'GET',
      header: { token, Authorization: token ? `Bearer ${token}` : '' },
      success: (res: any) => {
        const list = Array.isArray(res.data?.cdata)
          ? res.data.cdata
          : Array.isArray(res.data)
          ? res.data
          : []
        this.setData({ videoAlbums: list })
      },
      complete: () => {
        this.setData({ videoLoading: false })
      },
    })
  },

  onSelectVideoAlbum(e: any) {
    const item = e.currentTarget.dataset.item
    const albumid = Number(item?.album_id || e.currentTarget.dataset.id || 0)
    if (!albumid) return
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || ''
    this.setData({ videoLoading: true, activeAlbum: item })
    wx.request({
      url: `${getBaseUrl()}/api/video/fetch_album/${albumid}`,
      method: 'GET',
      header: { token, Authorization: token ? `Bearer ${token}` : '' },
      success: (res: any) => {
        const vdata = Array.isArray(res.data?.vdata) ? res.data.vdata : []
        const albumdata = res.data?.albumdata || item
        this.setData({
          albumVideos: vdata,
          activeAlbum: { ...item, ...albumdata, album_id: albumid },
        })
      },
      complete: () => {
        this.setData({ videoLoading: false })
      },
    })
  },

  onBackToAlbumList() {
    this.setData({ activeAlbum: null, albumVideos: [] })
  },

  onWatchVideo(e: any) {
    const item = e.currentTarget.dataset.item
    const videoid = Number(item?.video_id || e.currentTarget.dataset.id || 0)
    if (!videoid) return
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || ''
    this.setData({
      showVideoModal: true,
      currentVideo: {
        video_id: videoid,
        video_title: item?.video_title || '微课视频',
        video_length: item?.video_length || 0,
        video_url: item?.video_url || '',
        video_fulltext: '加载讲义文稿中...',
      },
    })
    wx.request({
      url: `${getBaseUrl()}/api/video/watch_video/${videoid}`,
      method: 'GET',
      header: { token, Authorization: token ? `Bearer ${token}` : '' },
      success: (res: any) => {
        const d = res.data || {}
        this.setData({
          currentVideo: {
            ...d,
            video_id: Number(d.video_id || videoid),
            video_title: d.video_title || item?.video_title || '微课视频',
            video_fulltext: stripHtmlTags(d.video_fulltext || '暂无配套文字讲义'),
          },
        })
      },
    })
  },

  onCloseVideoModal() {
    this.setData({ showVideoModal: false })
  },

  onCopyVideoUrl() {
    const url = this.data.currentVideo?.video_url
    if (!url) {
      wx.showToast({ title: '暂无外部视频链接', icon: 'none' })
      return
    }
    wx.setClipboardData({
      data: String(url),
      success: () => {
        wx.showToast({ title: '🔗 已复制视频链接', icon: 'none' })
      },
    })
  },

  async onFavorAlbum() {
    const album = this.data.activeAlbum
    if (!album || !album.album_id) return
    await this.favorResource(Number(album.album_id), '视频专辑', album.album_title || '微课专辑')
  },

  async onFavorVideo() {
    const v = this.data.currentVideo
    if (!v || !v.video_id) return
    await this.favorResource(Number(v.video_id), '视频', v.video_title || '微课视频')
  },

  // ── 103-show-maps.md, 101-map.md, 102-search-map.md: 知识脑图 ──
  fetchMindMaps() {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || ''
    this.setData({ mapLoading: true })
    wx.request({
      url: `${getBaseUrl()}/api/map/show_map`,
      method: 'GET',
      header: { token, Authorization: token ? `Bearer ${token}` : '' },
      success: (res: any) => {
        if (Array.isArray(res.data)) {
          this.setData({ mapList: res.data })
        }
      },
      complete: () => {
        this.setData({ mapLoading: false })
      },
    })
  },

  onSelectMindMap(e: any) {
    const item = e.currentTarget.dataset.item
    const mapid = Number(item?.mapid || item?.map_id || e.currentTarget.dataset.id || 0)
    if (!mapid) return
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || ''
    this.setData({ mapLoading: true, activeMap: item, activeMapNodes: [] })
    wx.request({
      url: `${getBaseUrl()}/api/map/get_map/${mapid}`,
      method: 'GET',
      header: { token, Authorization: token ? `Bearer ${token}` : '' },
      success: (res: any) => {
        const d = res.data || {}
        let parsed: any = null
        try {
          parsed = typeof d.map_data === 'string' ? JSON.parse(d.map_data) : d.map_data
        } catch (err) {
          parsed = null
        }
        const nodes = flattenMindMapNodes(parsed)
        this.setData({
          activeMap: {
            ...item,
            ...d,
            mapid,
            map_title: d.map_title || item?.map_title || '知识脑图',
            map_desc: stripHtmlTags(d.map_desc || ''),
          },
          activeMapNodes:
            nodes.length > 0
              ? nodes
              : [
                  {
                    id: '0-0',
                    name: d.map_title || item?.map_title || '核心主题',
                    depth: 0,
                    indentStyle: 'padding-left: 0rpx;',
                    childrenCount: 0,
                    note: stripHtmlTags(d.map_desc || ''),
                  },
                ],
        })
      },
      complete: () => {
        this.setData({ mapLoading: false })
      },
    })
  },

  onBackToMapList() {
    this.setData({ activeMap: null, activeMapNodes: [] })
  },

  onMapSearchInput(e: any) {
    const q = e.detail.value || ''
    this.setData({ mapSearchQuery: q })
    if (!q.trim()) {
      this.setData({ mapSearchResults: [] })
    }
  },

  async onRunMapSearch() {
    const query = String(this.data.mapSearchQuery || '').trim()
    if (!query) {
      this.setData({ mapSearchResults: [] })
      return
    }
    this.setData({ mapLoading: true })
    try {
      const res: any = await base.post('/api/map/search', { query })
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []
      this.setData({ mapSearchResults: list })
    } catch (err) {
      this.setData({ mapSearchResults: [] })
    } finally {
      this.setData({ mapLoading: false })
    }
  },

  async onFavorMap() {
    const m = this.data.activeMap
    if (!m || !m.mapid) return
    await this.favorResource(Number(m.mapid), '脑图', m.map_title || '知识脑图')
  },

  async favorResource(targetId: number, targetType: string, label: string) {
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
        target_id: targetId,
        target_type: targetType,
        folderlist: JSON.stringify(folders),
      })
      wx.showToast({ title: `⭐ 已收藏「${label}」`, icon: 'none' })
    } catch (err) {
      wx.showToast({ title: '收藏失败，请稍后重试', icon: 'none' })
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
    tab: 'all' | 'mine' | 'zhuanlan' | 'video' | 'map',
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
    if (tab === 'video') {
      this.setData({
        articleTab: 'video',
        searchKeyword: keyword,
      })
      if (!this.data.videoAlbums.length) {
        this.fetchVideoAlbums()
      }
      return
    }
    if (tab === 'map') {
      this.setData({
        articleTab: 'map',
        searchKeyword: keyword,
      })
      if (!this.data.mapList.length) {
        this.fetchMindMaps()
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
    const tab = (e.currentTarget.dataset.tab || 'all') as 'all' | 'mine' | 'zhuanlan' | 'video' | 'map'
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
    this.setData({
      showEditorModal: false,
      showZhuanlanModal: false,
      showCreateVideoModal: false,
      showCreateMapModal: false,
    })
  },

  // ── 104-edit-zhuanlan.md: 新建/保存专栏合集 ───────────────────
  onOpenCreateZhuanlanModal() {
    if (!this.data.hasLogin) {
      this.goToLogin()
      return
    }
    const firstArt = (this.data.allArticles || [])[0]
    this.setData({
      showZhuanlanModal: true,
      zhuanlanForm: {
        zhuanlan_title: '',
        first_article_id: firstArt ? Number(firstArt.articleid) : 0,
        first_part: '第一篇',
      },
    })
  },

  onZhuanlanFormInput(e: any) {
    const field = e.currentTarget.dataset.field
    if (!field) return
    this.setData({
      [`zhuanlanForm.${field}`]: e.detail.value,
    })
  },

  async onSaveZhuanlan() {
    if (this.data.savingZhuanlan) return
    const { zhuanlan_title, first_article_id, first_part } = this.data.zhuanlanForm
    const cleanTitle = String(zhuanlan_title || '').trim()
    if (!cleanTitle) {
      wx.showToast({ title: '请输入专栏合集名称', icon: 'none' })
      return
    }
    this.setData({ savingZhuanlan: true })
    try {
      const uid = Number(this.data.currentUserId || wx.getStorageSync('userId') || 1)
      const firstArt = (this.data.allArticles || []).find(
        (a: any) => Number(a.articleid) === Number(first_article_id)
      )
      const zhuanlanData = firstArt
        ? [
            {
              articleid: Number(firstArt.articleid),
              show_title: firstArt.title,
              zhuanlan_part: String(first_part || '第一篇').trim(),
            },
          ]
        : []
      await base.post('/api/article/savezhuanlan', {
        zhuanlan_id: 0,
        zhuanlan_title: cleanTitle,
        author_id: uid,
        article_amount: zhuanlanData.length,
        deleted_data: JSON.stringify([]),
        zhuanlan_data: JSON.stringify(zhuanlanData),
      })
      wx.showToast({ title: '📚 专栏合集已创建！', icon: 'success' })
      this.setData({ showZhuanlanModal: false })
      this.fetchZhuanlans()
    } catch {
      wx.showToast({ title: '保存专栏失败', icon: 'none' })
    } finally {
      this.setData({ savingZhuanlan: false })
    }
  },

  // ── 101-edit-album.md & 102-edit-video.md: 发布微课视频与专辑 ──
  onOpenCreateVideoModal() {
    if (!this.data.hasLogin) {
      this.goToLogin()
      return
    }
    this.setData({
      showCreateVideoModal: true,
      videoForm: {
        album_title: this.data.activeAlbum?.album_title || '',
        video_title: '',
        video_desc: '',
        video_length: 15,
        video_websrc: '',
        video_fulltext: '',
      },
    })
  },

  onVideoFormInput(e: any) {
    const field = e.currentTarget.dataset.field
    if (!field) return
    this.setData({
      [`videoForm.${field}`]: e.detail.value,
    })
  },

  async onSaveVideoAndAlbum() {
    if (this.data.savingVideo) return
    const f = this.data.videoForm
    const vTitle = String(f.video_title || '').trim()
    const aTitle = String(f.album_title || '').trim() || vTitle
    if (!vTitle) {
      wx.showToast({ title: '请输入微课视频标题', icon: 'none' })
      return
    }
    this.setData({ savingVideo: true })
    try {
      const uid = Number(this.data.currentUserId || wx.getStorageSync('userId') || 1)
      const vRes: any = await base.post('/api/video/savevideo', {
        action: 'new',
        video_title: vTitle,
        video_desc: String(f.video_desc || vTitle).trim(),
        video_fulltext: String(f.video_fulltext || '').trim(),
        video_length: Number(f.video_length || 15),
        upstyle: 'Web',
        videochange: 'yes',
        video_websrc: String(f.video_websrc || '').trim(),
      })
      const createdVideoId = Number(vRes?.result?.videoid || 0)
      await base.post('/api/video/save_album', {
        album_id: Number(this.data.activeAlbum?.album_id || 0),
        album_title: aTitle,
        author_id: uid,
        wholelength: Number(f.video_length || 15),
        deleted_data: JSON.stringify([]),
        album_data: JSON.stringify(
          createdVideoId > 0
            ? [
                {
                  videoid: createdVideoId,
                  show_title: vTitle,
                  album_part: '第一节',
                },
              ]
            : []
        ),
      })
      wx.showToast({ title: '🎬 微课与专辑已发布！', icon: 'success' })
      this.setData({ showCreateVideoModal: false })
      this.fetchVideoAlbums()
    } catch {
      wx.showToast({ title: '发布微课失败', icon: 'none' })
    } finally {
      this.setData({ savingVideo: false })
    }
  },

  // ── 104-edit-map.md: 新建/保存知识脑图 ─────────────────────────
  onOpenCreateMapModal() {
    if (!this.data.hasLogin) {
      this.goToLogin()
      return
    }
    this.setData({
      showCreateMapModal: true,
      mapForm: {
        map_title: '',
        map_desc: '',
        root_topic: '',
        children_topics: '',
      },
    })
  },

  onMapFormInput(e: any) {
    const field = e.currentTarget.dataset.field
    if (!field) return
    this.setData({
      [`mapForm.${field}`]: e.detail.value,
    })
  },

  async onSaveMindMap() {
    if (this.data.savingMap) return
    const f = this.data.mapForm
    const mapTitle = String(f.map_title || '').trim()
    const rootTopic = String(f.root_topic || mapTitle).trim()
    if (!mapTitle) {
      wx.showToast({ title: '请输入知识脑图名称', icon: 'none' })
      return
    }
    this.setData({ savingMap: true })
    try {
      const childNames = String(f.children_topics || '')
        .split(/[,，\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
      const nowId = Date.now()
      const nodeData = {
        id: `root-${nowId}`,
        topic: rootTopic,
        root: true,
        children: childNames.map((name, idx) => ({
          id: `node-${nowId}-${idx + 1}`,
          topic: name,
          children: [],
        })),
      }
      await base.post('/api/map/save_map', {
        map_id: 0,
        map_title: mapTitle,
        map_desc: String(f.map_desc || `${mapTitle} 结构化知识脑图`).trim(),
        data: JSON.stringify({ nodeData }),
      })
      wx.showToast({ title: '🗺️ 知识脑图已创建！', icon: 'success' })
      this.setData({ showCreateMapModal: false })
      this.fetchMindMaps()
    } catch {
      wx.showToast({ title: '创建脑图失败', icon: 'none' })
    } finally {
      this.setData({ savingMap: false })
    }
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
