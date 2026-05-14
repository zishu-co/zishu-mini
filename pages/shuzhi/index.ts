// @ts-nocheck
import { fetchShuzhi } from '../../services/user/user'

Page({
  data: {
    listData: [] as any[],
    loading: true,
  },

  computed: {
    totalAmount(): number {
      return this.data.listData.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0)
    },
    currentBalance(): number {
      const len = this.data.listData.length
      return len > 0 ? this.data.listData[len - 1].balance : 0
    },
  },

  onLoad() {
    this.fetchData()
  },

  fetchData() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    const userId = userInfo.userId || 0

    wx.showLoading({ title: '加载中...', mask: true })

    fetchShuzhi(userId)
      .then((res: any) => {
        wx.hideLoading()
        if (Array.isArray(res)) {
          this.setData({ listData: res, loading: false })
        } else {
          this.setData({ listData: [], loading: false })
        }
      })
      .catch((e) => {
        wx.hideLoading()
        this.setData({ listData: [], loading: false })
      })
  },
})