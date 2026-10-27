// @ts-nocheck
import { fetchFolder, fetchFavor, deleteFavor } from '../../services/user/user'

Page({
  data: {
    folders: [] as any[],
    items: [] as any[],
    activeIndex: 0,
    loading: true,
  },

  onLoad() {
    this.fetchFolders()
  },

  fetchFolders() {
    wx.showLoading({ title: '加载中...', mask: true })

    fetchFolder()
      .then((res: any) => {
        wx.hideLoading()
        const folders = Array.isArray(res) ? res : []
        this.setData({ folders })
        if (folders.length > 0) {
          this.fetchItems(folders[0].folderid)
        } else {
          this.setData({ loading: false })
        }
      })
      .catch(() => {
        wx.hideLoading()
        this.setData({ folders: [], loading: false })
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
        const items = rawItems.map((item: any) => ({
          ...item,
          _typeIcon: this.typeIcon(item.target_type),
        }))
        this.setData({ items, loading: false })
      })
      .catch(() => {
        this.setData({ items: [], loading: false })
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
    const { favorid, index } = e.currentTarget.dataset
    const items = [...this.data.items]

    wx.showModal({
      title: '确认删除',
      content: '确定删除此收藏？',
      success: (res) => {
        if (!res.confirm) return

        deleteFavor(favorid)
          .then(() => {
            items.splice(index, 1)
            this.setData({ items })

            // 更新文件夹计数
            const folders = [...this.data.folders]
            const activeIndex = this.data.activeIndex
            if (folders[activeIndex]) {
              folders[activeIndex].item_num = Math.max(0, (folders[activeIndex].item_num || 1) - 1)
              this.setData({ folders })
            }

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