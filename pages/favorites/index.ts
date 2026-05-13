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
    const index = e.currentTarget.dataset.index
    const folder = this.data.folders[index]
    this.setData({ activeIndex: index, loading: true })
    this.fetchItems(folder.folderid)
  },

  fetchItems(folderId: string) {
    fetchFavor(folderId)
      .then((res: any) => {
        let items = []
        if (typeof res === 'string') {
          try { items = JSON.parse(res) } catch { items = res }
        } else if (Array.isArray(res)) {
          items = res
        }
        this.setData({ items, loading: false })
      })
      .catch(() => {
        this.setData({ items: [], loading: false })
      })
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
      '试卷': '📝',
      '合集': '🎬',
      '视频': '🎥',
      '文章': '📄',
    }
    return map[type] || '📌'
  },
})