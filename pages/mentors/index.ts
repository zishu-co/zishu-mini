// @ts-nocheck
import { get } from '../../services/base'

Page({
  data: {
    listData: [] as any[],
    loading: true,
  },

  onLoad() {
    this.fetchData()
  },

  fetchData() {
    wx.showLoading({ title: '加载中...', mask: true })

    get('/api/course/list_all_mentors')
      .then((res: any) => {
        wx.hideLoading()
        const listData = Array.isArray(res) ? res : []
        this.setData({ listData, loading: false })
      })
      .catch(() => {
        wx.hideLoading()
        this.setData({ listData: [], loading: false })
      })
  },

  get shushiCount(): number {
    const ids = new Set<number>()
    this.data.listData.forEach((item: any) => { if (item.shushi_id) ids.add(item.shushi_id) })
    return ids.size
  },

  get shushengCount(): number {
    const ids = new Set<number>()
    this.data.listData.forEach((item: any) => { if (item.shusheng_id) ids.add(item.shusheng_id) })
    return ids.size
  },
})