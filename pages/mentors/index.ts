// @ts-nocheck
import base from '../../services/base'
import { quickGreetPeer } from '../../services/user/user'

const { get } = base

Page({
  data: {
    listData: [] as any[],
    filteredList: [] as any[],
    searchKeyword: '',
    shushiCount: 0,
    shushengCount: 0,
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
      const shushi = String(item.shushi_name || '').toLowerCase()
      const shusheng = String(item.shusheng_name || '').toLowerCase()
      const course = String(item.course_title || '').toLowerCase()
      return (
        shushi.indexOf(kw) !== -1 ||
        shusheng.indexOf(kw) !== -1 ||
        course.indexOf(kw) !== -1
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

  fetchData() {
    this.setData({ loading: true })
    return get('/api/learn/list_all_mentors')
      .then((res: any) => {
        const raw = Array.isArray(res) ? res : []
        const shushiIds = new Set<number>()
        const shushengIds = new Set<number>()
        const listData = raw.map((item: any) => {
          if (item.shushi_id) shushiIds.add(Number(item.shushi_id))
          if (item.shusheng_id) shushengIds.add(Number(item.shusheng_id))
          return {
            ...item,
            _startDate: item.start_time ? String(item.start_time).slice(0, 10) : '',
            _isActive: item.status === '活跃' || item.status === '新选' || item.status === '改课',
          }
        })
        const filteredList = this.applySearch(listData, this.data.searchKeyword)
        this.setData({
          listData,
          filteredList,
          shushiCount: shushiIds.size,
          shushengCount: shushengIds.size,
          loading: false,
        })
      })
      .catch(() => {
        this.setData({
          listData: [],
          filteredList: [],
          shushiCount: 0,
          shushengCount: 0,
          loading: false,
        })
      })
  },

  onGoCourse(e: any) {
    const courseId = e.currentTarget.dataset.courseid
    if (!courseId) return
    wx.navigateTo({ url: `/pages/course-detail/index?id=${courseId}` })
  },

  async onGreetMentor(e: any) {
    const shushiId = Number(e.currentTarget.dataset.userid || 0)
    const shushiName = e.currentTarget.dataset.name || '塾师'
    const courseTitle = e.currentTarget.dataset.course || '自塾课程'
    if (!shushiId) return
    try {
      const res: any = await quickGreetPeer({
        target_user_id: shushiId,
        topic: `请教《${courseTitle}》学习规划与伴学指导`,
        planed_duration: 15,
      })
      wx.showToast({
        title: res?.message || `已向 ${shushiName} 塾师发起请教约聊！`,
        icon: 'none',
      })
    } catch {
      wx.showToast({
        title: `👋 已向 ${shushiName} 塾师发送问候`,
        icon: 'none',
      })
    }
  },
})
