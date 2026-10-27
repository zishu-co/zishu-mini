// @ts-nocheck
import { fetchCurrentSelections } from '../../services/course/course'
import { quickGreetPeer } from '../../services/user/user'

Page({
  data: {
    listData: [] as any[],
    overdueCount: 0,
    nearCount: 0,
    loading: true,
  },

  onLoad() {
    this.fetchData()
  },

  onPullDownRefresh() {
    this.fetchData().finally(() => wx.stopPullDownRefresh())
  },

  async fetchData() {
    this.setData({ loading: true })
    try {
      const res = await fetchCurrentSelections()
      const raw = Array.isArray(res) ? res : []
      let overdueCount = 0
      let nearCount = 0
      const listData = raw.map((r: any) => {
        const cls = this.getDeadlineClass(r.deadline)
        if (cls === 'red' || cls === 'purple') overdueCount += 1
        if (cls === 'orange' || cls === 'blue') nearCount += 1
        return {
          ...r,
          _deadlineClass: cls,
          _deadlineStr: r.deadline ? String(r.deadline).slice(0, 10) : '-',
        }
      })
      this.setData({
        listData,
        overdueCount,
        nearCount,
        loading: false,
      })
    } catch (e) {
      this.setData({
        listData: [],
        overdueCount: 0,
        nearCount: 0,
        loading: false,
      })
    }
  },

  onGoCourse(e: any) {
    const courseId = e.currentTarget.dataset.courseid
    if (!courseId) return
    wx.navigateTo({ url: `/pages/course-detail/index?id=${courseId}` })
  },

  async onNudgePeer(e: any) {
    const userId = Number(e.currentTarget.dataset.userid || 0)
    const userName = e.currentTarget.dataset.username || '同路人'
    const courseTitle = e.currentTarget.dataset.course || '课程'
    if (!userId) return
    try {
      await quickGreetPeer({
        target_user_id: userId,
        topic: `共学鼓励：一起推进《${courseTitle}》章节打卡！`,
        planed_duration: 15,
      })
    } catch {}
    wx.showToast({
      title: `⚡ 已向 ${userName} 发送共学加油鼓励！`,
      icon: 'none',
    })
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
