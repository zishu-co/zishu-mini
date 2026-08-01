// @ts-nocheck
import { fetchGoaltalk, fetchFinishedGoaltalk, fetchAllGoals } from '../../services/user/user'

Page({
  data: {
    activeTab: 0,
    scheduledData: [] as any[],
    goalsData: [] as any[],
    historyData: [] as any[],
    loading: true,
    loadingGoals: false,
    loadingHistory: false,
  },

  onLoad() {
    this.fetchScheduled()
  },

  switchTab(e: any) {
    const tab = parseInt(e.currentTarget.dataset.tab)
    this.setData({ activeTab: tab })
    if (tab === 1 && this.data.goalsData.length === 0) {
      this.fetchGoals()
    } else if (tab === 2 && this.data.historyData.length === 0) {
      this.fetchHistory()
    }
  },

  fetchScheduled() {
    this.setData({ loading: true })
    fetchGoaltalk()
      .then((res: any) => {
        const scheduledData = Array.isArray(res) ? res : []
        this.setData({ scheduledData, loading: false })
      })
      .catch((e) => {
        this.setData({ scheduledData: [], loading: false })
      })
  },

  fetchGoals() {
    this.setData({ loadingGoals: true })
    fetchAllGoals()
      .then((res: any) => {
        const goalsData = Array.isArray(res) ? res : []
        this.setData({ goalsData, loadingGoals: false })
      })
      .catch((e) => {
        this.setData({ goalsData: [], loadingGoals: false })
      })
  },

  fetchHistory() {
    this.setData({ loadingHistory: true })
    fetchFinishedGoaltalk()
      .then((res: any) => {
        const historyData = Array.isArray(res) ? res : []
        this.setData({ historyData, loadingHistory: false })
      })
      .catch((e) => {
        this.setData({ historyData: [], loadingHistory: false })
      })
  },

  viewDetail(e: any) {
    const item = e.currentTarget.dataset.item
    let msg = `塾生: ${item.shusheng_name || '群发'}\n`
    msg += `预定时间: ${item.planed_time || '-'}\n`
    msg += `计划时长: ${item.planed_duration || 10} 分钟\n`
    if (item.confirmed_time) msg += `确认时间: ${item.confirmed_time}\n`
    if (item.access_info) msg += `面谈入口: ${item.access_info}`
    wx.showModal({
      title: '面谈详情',
      content: msg,
      showCancel: false,
    })
  },

  viewContent(e: any) {
    const { content, title } = e.currentTarget.dataset
    if (content) {
      wx.showModal({
        title: title,
        content: content,
        showCancel: false,
      })
    }
  },

  getStatusClass(item: any): string {
    if (item.confirmer) return 'confirmed'
    if (item.planed_time) {
      const now = Date.now()
      const planed = new Date(item.planed_time).getTime()
      if (planed < now) return 'overdue'
      return 'pending'
    }
    return ''
  },

  onShareAppMessage() {
    return { title: '自塾·目标面谈', path: '/pages/goaltalk/index' };
  },

  onShareTimeline() {
    return { title: '自塾·目标面谈' };
  },

  getStatusText(item: any): string {
    if (item.confirmer) return '已确认'
    if (item.planed_time) {
      const now = Date.now()
      const planed = new Date(item.planed_time).getTime()
      if (planed < now) return '已逾期'
      return '待确认'
    }
    return '待安排'
  },
})