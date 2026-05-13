// @ts-nocheck
import { get } from '../../services/base'

Page({
  data: {
    allData: [] as any[],
    listData: [] as any[],
    loading: true,
    showMine: false,
  },

  onLoad() {
    this.fetchData()
  },

  fetchData() {
    wx.showLoading({ title: '加载中...', mask: true })

    get('/api/inno/fetch_finished_projects')
      .then((res: any) => {
        wx.hideLoading()
        const allData = Array.isArray(res) ? res : []
        this.setData({ allData, listData: allData, loading: false })
      })
      .catch(() => {
        wx.hideLoading()
        this.setData({ allData: [], listData: [], loading: false })
      })
  },

  toggleFilter() {
    const showMine = !this.data.showMine
    if (showMine) {
      const userId = wx.getStorageSync('userInfo')?.userId
      const filtered = this.data.allData.filter((item: any) => item.taker_id === userId)
      this.setData({ listData: filtered, showMine })
    } else {
      this.setData({ listData: this.data.allData, showMine })
    }
  },
})