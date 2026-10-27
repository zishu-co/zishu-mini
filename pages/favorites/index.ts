// @ts-nocheck
import { fetchFolder, fetchFavor, deleteFavor, newFolder } from '../../services/user/user'

Page({
  data: {
    folders: [] as any[],
    items: [] as any[],
    filteredItems: [] as any[],
    searchKeyword: '',
    totalItemsCount: 0,
    activeIndex: 0,
    loading: true,
  },

  onLoad() {
    this.fetchFolders()
  },

  computeTotalItems(folders: any[]) {
    return (folders || []).reduce((acc: number, f: any) => acc + (Number(f.item_num) || 0), 0)
  },

  applySearchFilter(items: any[], keyword: string) {
    const kw = (keyword || '').trim().toLowerCase()
    if (!kw) return items
    return (items || []).filter((item: any) => {
      const title = String(item.target_title || '').toLowerCase()
      const type = String(item.target_type || '').toLowerCase()
      return title.indexOf(kw) !== -1 || type.indexOf(kw) !== -1
    })
  },

  onSearchInput(e: any) {
    const searchKeyword = e.detail.value || ''
    const filteredItems = this.applySearchFilter(this.data.items, searchKeyword)
    this.setData({ searchKeyword, filteredItems })
  },

  clearSearch() {
    this.setData({
      searchKeyword: '',
      filteredItems: this.data.items,
    })
  },

  goToArticles() {
    wx.navigateTo({ url: '/pages/article/index' })
  },

  onCreateFolder() {
    wx.showModal({
      title: '新建收藏夹',
      editable: true,
      placeholderText: '请输入收藏夹名称（如：AI好课、精选文章）',
      confirmText: '创建',
      success: async (res) => {
        if (!res.confirm) return
        const name = String(res.content || '').trim()
        if (!name) {
          wx.showToast({ title: '请输入收藏夹名称', icon: 'none' })
          return
        }
        try {
          wx.showLoading({ title: '创建中...', mask: true })
          await newFolder(name)
          wx.hideLoading()
          wx.showToast({ title: '已新建收藏夹', icon: 'success' })
          this.fetchFolders()
        } catch (err) {
          wx.hideLoading()
          wx.showToast({ title: '创建失败，请重试', icon: 'none' })
        }
      },
    })
  },

  fetchFolders() {
    wx.showLoading({ title: '加载中...', mask: true })

    fetchFolder()
      .then((res: any) => {
        wx.hideLoading()
        const folders = Array.isArray(res) ? res : []
        const totalItemsCount = this.computeTotalItems(folders)
        this.setData({ folders, totalItemsCount })
        if (folders.length > 0) {
          this.fetchItems(folders[0].folderid)
        } else {
          this.setData({ loading: false })
        }
      })
      .catch(() => {
        wx.hideLoading()
        this.setData({ folders: [], totalItemsCount: 0, loading: false })
      })
  },

  switchFolder(e: any) {
    const index = Number(e.currentTarget.dataset.index)
    const folder = this.data.folders[index]
    if (!folder) return
    this.setData({ activeIndex: index, loading: true })
    this.fetchItems(folder.folderid)
  },

  fetchItems(folderId: string) {
    fetchFavor(folderId)
      .then((res: any) => {
        let rawItems: any[] = []
        if (typeof res === 'string') {
          try {
            const parsed = JSON.parse(res)
            rawItems = Array.isArray(parsed) ? parsed : []
          } catch {
            rawItems = []
          }
        } else if (Array.isArray(res)) {
          rawItems = res
        }
        const items = rawItems.map((item: any, idx: number) => ({
          ...item,
          _origIndex: idx,
          _typeIcon: this.typeIcon(item.target_type),
        }))
        const filteredItems = this.applySearchFilter(items, this.data.searchKeyword)
        this.setData({ items, filteredItems, loading: false })
      })
      .catch(() => {
        this.setData({ items: [], filteredItems: [], loading: false })
      })
  },

  onItemTap(e: any) {
    const { type, targetid } = e.currentTarget.dataset
    if (!targetid) return
    if (type === '课程' || type === '合集' || type === '视频') {
      wx.navigateTo({ url: `/pages/course-detail/index?id=${targetid}` })
    } else if (type === '文章') {
      wx.navigateTo({ url: `/pages/article/index?id=${targetid}` })
    } else if (type === '试卷') {
      wx.navigateTo({ url: `/pages/test/test?testid=${targetid}` })
    }
  },

  deleteItem(e: any) {
    const { favorid } = e.currentTarget.dataset

    wx.showModal({
      title: '确认删除',
      content: '确定删除此收藏？',
      success: (res) => {
        if (!res.confirm) return

        deleteFavor(favorid)
          .then(() => {
            const items = this.data.items.filter(
              (it: any) => Number(it.favorid) !== Number(favorid)
            )
            const filteredItems = this.applySearchFilter(items, this.data.searchKeyword)

            // 更新文件夹计数
            const folders = [...this.data.folders]
            const activeIndex = this.data.activeIndex
            if (folders[activeIndex]) {
              folders[activeIndex].item_num = Math.max(0, (folders[activeIndex].item_num || 1) - 1)
            }
            const totalItemsCount = this.computeTotalItems(folders)

            this.setData({ items, filteredItems, folders, totalItemsCount })
            wx.showToast({ title: '删除成功', icon: 'success' })
          })
          .catch(() => {
            wx.showToast({ title: '删除失败', icon: 'none' })
          })
      },
    })
  },

  typeIcon(type: string): string {
    const map: Record<string, string> = {
      '课程': '📚',
      '试卷': '📝',
      '合集': '🎬',
      '视频': '🎥',
      '文章': '📄',
    }
    return map[type] || '📌'
  },
})