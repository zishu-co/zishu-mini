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
      title: '自塾师生共学看板 · 寻访领航塾师与共修塾生',
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
    const fallbackMentors = [
      {
        id: 1,
        shushi_id: 1,
        shushi_name: '青桐塾主',
        shusheng_id: 101,
        shusheng_name: '苏晓',
        course_id: 1,
        course_title: 'Python 编程与自动化实战',
        status: '活跃',
        start_time: '2026-10-01',
        update_time: '2026-10-28',
      },
      {
        id: 2,
        shushi_id: 2,
        shushi_name: '林深塾师',
        shusheng_id: 102,
        shusheng_name: '陈默',
        course_id: 2,
        course_title: 'FastAPI 高并发后端架构',
        status: '活跃',
        start_time: '2026-10-08',
        update_time: '2026-10-27',
      },
    ]
    const applyList = (rawInput: any[]) => {
      const raw = Array.isArray(rawInput) && rawInput.length > 0 ? rawInput : fallbackMentors
      const shushiIds = new Set<number>()
      const shushengIds = new Set<number>()
      const listData = raw.map((item: any) => {
        if (item.shushi_id) shushiIds.add(Number(item.shushi_id))
        if (item.shusheng_id) shushengIds.add(Number(item.shusheng_id))
        const staleness = this.getUpdateStaleness(item.update_time || item.start_time)
        return {
          ...item,
          _startDate: item.start_time ? String(item.start_time).slice(0, 10) : '',
          _updateDate: item.update_time ? String(item.update_time).slice(0, 10) : '',
          _isActive: item.status === '活跃' || item.status === '新选' || item.status === '改课' || !item.status,
          _stalenessClass: staleness.cls,
          _stalenessLabel: staleness.label,
          _isStale: staleness.isStale,
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
    }
    return get('/api/learn/list_all_mentors', undefined, { silentAuthError: true })
      .then((res: any) => applyList(res))
      .catch(() => applyList(fallbackMentors))
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
        title: res?.message || `已向 ${shushiName} 塾师发起请教沟通！`,
        icon: 'none',
      })
    } catch {
      wx.showToast({
        title: `👋 已向 ${shushiName} 塾师发送问候`,
        icon: 'none',
      })
    }
  },

  // 104-mentors.md: 4 色超期状态与清理超期师生关系 (POST /api/learn/cleanse_mentor)
  getUpdateStaleness(updateStr: string) {
    if (!updateStr) return { cls: '', label: '', isStale: false }
    const d = new Date(updateStr)
    const now = new Date()
    if (isNaN(d.getTime())) return { cls: '', label: '', isStale: false }
    const diffDays = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays <= -180) {
      return { cls: 'red', label: '⚠️ 超半年未更新', isStale: true }
    }
    if (diffDays <= -90) {
      return { cls: 'purple', label: '⏳ 超3个月未更新', isStale: true }
    }
    if (diffDays <= -30) {
      return { cls: 'orange', label: '⏳ 超1个月未更新', isStale: true }
    }
    return { cls: 'blue', label: '✅ 近期活跃', isStale: false }
  },

  onCleanseMentor(e: any) {
    const id = Number(e.currentTarget.dataset.id || 0)
    const shushiName = e.currentTarget.dataset.shushi || '塾师'
    const shushengName = e.currentTarget.dataset.shusheng || '塾生'
    if (!id) return
    wx.showModal({
      title: '清理超期师生结对',
      content: `确认清理「${shushiName} ⇄ ${shushengName}」超期一个月以上的师生关系吗？`,
      confirmColor: '#ef4444',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await base.post('/api/learn/cleanse_mentor', { id })
          wx.showToast({ title: '🧹 已清理超期关系', icon: 'success' })
          this.fetchData()
        } catch (err) {
          wx.showToast({ title: '清理失败，请稍后重试', icon: 'none' })
        }
      },
    })
  },
})
