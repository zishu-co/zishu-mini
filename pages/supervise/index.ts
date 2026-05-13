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
    get('/api/course/fetch_all_selection')
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

  get overdueCount(): number {
    return this.data.listData.filter((r: any) => this.getDeadlineClass(r.deadline) === 'red').length
  },

  get nearCount(): number {
    return this.data.listData.filter((r: any) => {
      const cls = this.getDeadlineClass(r.deadline)
      return cls === 'orange' || cls === 'blue'
    }).length
  },

  getDeadlineClass(deadline: string): string {
    if (!deadline) return ''
    const deadlineDate = new Date(deadline)
    const todayDate = new Date()
    if (isNaN(deadlineDate.getTime()) || isNaN(todayDate.getTime())) return ''
    const diffDays = (deadlineDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays > 1 && diffDays <= 3) return 'blue'
    else if (diffDays > 0 && diffDays <= 1) return 'orange'
    else if (diffDays < 0 && diffDays > -30) return 'purple'
    else if (diffDays <= -30) return 'red'
    return ''
  },
})