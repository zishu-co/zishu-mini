// @ts-nocheck
import { get } from '../../services/base'

Page({
  data: {
    members: [] as any[],
    loading: true,
  },

  onLoad() {
    this.fetchMembers()
  },

  fetchMembers() {
    wx.showLoading({ title: '加载中...', mask: true })

    get('/api/users/fetch_all')
      .then((res: any) => {
        wx.hideLoading()
        const members = Array.isArray(res) ? res : []
        this.setData({
          members,
          loading: false,
        })
      })
      .catch(() => {
        wx.hideLoading()
        this.setData({ members: [], loading: false })
      })
  },

  get totalCount(): number {
    return this.data.members.length
  },
  get activeCount(): number {
    return this.data.members.filter((u: any) => u.shuzhi >= 10).length
  },
  get inactiveCount(): number {
    return this.data.members.filter((u: any) => u.shuzhi < 10).length
  },
})