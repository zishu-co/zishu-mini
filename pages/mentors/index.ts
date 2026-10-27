// @ts-nocheck
import base from '../../services/base'
import { quickGreetPeer } from '../../services/user/user'

const { get } = base

Page({
  data: {
    listData: [] as any[],
    filteredList: [] as any[],
    searchKeyword: '',
    statusFilter: 'all',
    currentUserId: 0,
    shushiCount: 0,
    shushengCount: 0,
    loading: true,
  },

  onLoad() {
    const uid =
      Number(wx.getStorageSync('userId')) ||
      Number(wx.getStorageSync('userInfo')?.userId) ||
      Number(wx.getStorageSync('userInfo')?.id) ||
      0
    this.setData({ currentUserId: uid })
    this.fetchData()
  },

  onPullDownRefresh() {
    this.fetchData().finally(() => wx.stopPullDownRefresh())
  },

  onShareAppMessage() {
    return {
      title: '自塾师生共学广场 · 寻访领航塾师与共修同路人',
      path: '/pages/mentors/index',
    }
  },

  applySearch(list: any[], keyword: string, statusFilter?: string) {
    const kw = (keyword || '').trim().toLowerCase()
    const sf = statusFilter || this.data.statusFilter || 'all'
    const uid = this.data.currentUserId
    return (list || []).filter((item: any) => {
      if (sf === 'active' && !item._isActive) return false
      if (sf === 'mine' && uid > 0 && Number(item.shushi_id) !== uid && Number(item.shusheng_id) !== uid) {
        return false
      }
      if (!kw) return true
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
    const filteredList = this.applySearch(this.data.listData, searchKeyword, this.data.statusFilter)
    this.setData({ searchKeyword, filteredList })
  },

  onSelectStatus(e: any) {
    const statusFilter = e.currentTarget.dataset.status || 'all'
    const filteredList = this.applySearch(this.data.listData, this.data.searchKeyword, statusFilter)
    this.setData({ statusFilter, filteredList })
  },

  clearSearch() {
    this.setData({
      searchKeyword: '',
      statusFilter: 'all',
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
            _isActive: item.status === '活跃' || item.status === '新选' || item.status === '改课' || !item.status,
          }
        })
        const filteredList = this.applySearch(listData, this.data.searchKeyword, this.data.statusFilter)
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

  onGoLearnSheet(e: any) {
    const userId = e.currentTarget.dataset.userid
    if (!userId) return
    wx.navigateTo({ url: `/pages/learn-sheet/index?userId=${userId}` })
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
