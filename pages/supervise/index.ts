// @ts-nocheck
import { fetchAllSelections, fetchCurrentSelections } from '../../services/course/course'
import { quickGreetPeer } from '../../services/user/user'

Page({
  data: {
    listData: [] as any[],
    filteredList: [] as any[],
    searchKeyword: '',
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

  applySearch(list: any[], keyword: string) {
    const kw = (keyword || '').trim().toLowerCase()
    if (!kw) return list
    return (list || []).filter((item: any) => {
      const user = String(item.user_name || '').toLowerCase()
      const shushi = String(item.shushi_name || '').toLowerCase()
      const course = String(item.course_title || '').toLowerCase()
      const chapter = String(item.chapter_title || '').toLowerCase()
      return (
        user.indexOf(kw) !== -1 ||
        shushi.indexOf(kw) !== -1 ||
        course.indexOf(kw) !== -1 ||
        chapter.indexOf(kw) !== -1
      )
    })
  },

  onSearchInput(e: any) {
    const searchKeyword = e.detail.value || ''
    const filteredList = this.applySearch(this.data.listData, searchKeyword)
    this.setData({ searchKeyword, filteredList })
  },

  clearSearch() {
    this.setData({
      searchKeyword: '',
      filteredList: this.data.listData,
    })
  },

  async fetchData() {
    this.setData({ loading: true })
    try {
      let res = await fetchAllSelections().catch(() => [])
      if (!Array.isArray(res) || res.length === 0) {
        res = await fetchCurrentSelections().catch(() => [])
      }
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
      const filteredList = this.applySearch(listData, this.data.searchKeyword)
      this.setData({
        listData,
        filteredList,
        overdueCount,
        nearCount,
        loading: false,
      })
    } catch (e) {
      this.setData({
        listData: [],
        filteredList: [],
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
