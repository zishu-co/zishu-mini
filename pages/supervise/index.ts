// @ts-nocheck
import { fetchCurrentSelections } from '../../services/course/course'

Page({
  data: {
    listData: [] as any[],
    loading: true,
  },

  onLoad() {
    this.fetchData()
  },

  async fetchData() {
    this.setData({ loading: true })
    try {
      const res = await fetchCurrentSelections()
      const listData = Array.isArray(res) ? res : []
      this.setData({ listData, loading: false })
    } catch (e) {
      this.setData({ listData: [], loading: false })
    }
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

  onShareAppMessage() {
    return { title: '自塾·学习监督', path: '/pages/supervise/index' };
  },

  onShareTimeline() {
    return { title: '自塾·学习监督' };
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