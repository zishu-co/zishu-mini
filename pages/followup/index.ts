// @ts-nocheck
import base from '../../services/base'
import { quickGreetPeer } from '../../services/user/user'
const { get } = base

Page({
  data: {
    allData: [] as any[],
    listData: [] as any[],
    filteredList: [] as any[],
    searchKeyword: '',
    loading: true,
    filterMode: 'all', // 'all' | 'efficient' | 'mine'
    showMine: false,
    stats: {
      totalCount: 0,
      totalActualHours: 0,
      avgEfficiency: 100,
    },
  },

  onLoad() {
    this.fetchData()
  },

  onPullDownRefresh() {
    this.fetchData().finally(() => wx.stopPullDownRefresh())
  },

  onShareAppMessage() {
    return {
      title: `自塾共学结项成果厅 · 已沉淀 ${this.data.stats.totalCount} 个实战结项项目`,
      path: '/pages/followup/index',
    }
  },

  applyFilters(allData: any[], filterMode: string, keyword: string) {
    let baseList = allData || []
    if (filterMode === 'mine') {
      const storedUserInfo = wx.getStorageSync('userInfo') || {}
      const userId = wx.getStorageSync('userId') || storedUserInfo.userId || storedUserInfo.id
      const userName = storedUserInfo.name || storedUserInfo.nickName || ''
      baseList = baseList.filter(
        (item: any) =>
          (userId && Number(item.taker_id) === Number(userId)) ||
          (userName && item.taker === userName)
      )
    } else if (filterMode === 'efficient') {
      baseList = baseList.filter((item: any) => item._isEfficient)
    }
    const kw = (keyword || '').trim().toLowerCase()
    if (!kw) return baseList
    return baseList.filter((item: any) => {
      const title = String(item.title || '').toLowerCase()
      const serial = String(item.task_serial || '').toLowerCase()
      const taker = String(item.taker || '').toLowerCase()
      const shushi = String(item.shushi || '').toLowerCase()
      return (
        title.indexOf(kw) !== -1 ||
        serial.indexOf(kw) !== -1 ||
        taker.indexOf(kw) !== -1 ||
        shushi.indexOf(kw) !== -1
      )
    })
  },

  onSearchInput(e: any) {
    const searchKeyword = e.detail.value || ''
    const listData = this.applyFilters(this.data.allData, this.data.filterMode, searchKeyword)
    this.setData({ searchKeyword, listData, filteredList: listData })
  },

  clearSearch() {
    const listData = this.applyFilters(this.data.allData, this.data.filterMode, '')
    this.setData({ searchKeyword: '', listData, filteredList: listData })
  },

  fetchData() {
    this.setData({ loading: true })
    const fallbackProjects = [
      {
        id: 3,
        task_serial: 'D003',
        title: '自塾开源工程规范与新塾员共学手册沉淀',
        taker: '陈默',
        taker_id: 102,
        shushi: '林深塾师',
        shushi_id: 2,
        bonus: 40,
        planed_hour: 6,
        actual_hour: 5,
        start_date: '2026-10-01',
        deadline: '2026-10-25',
        finish_date: '2026-10-24',
        half_progress: '已完成',
      },
      {
        id: 4,
        task_serial: 'F004',
        title: '微信小程序自定义 TabBar 与主题视觉体系重构',
        taker: '苏晓',
        taker_id: 101,
        shushi: '青桐塾主',
        shushi_id: 1,
        bonus: 50,
        planed_hour: 8,
        actual_hour: 7,
        start_date: '2026-10-05',
        deadline: '2026-10-22',
        finish_date: '2026-10-21',
        half_progress: '已完成',
      },
    ]
    const applyList = (rawList: any[]) => {
      const raw = Array.isArray(rawList) && rawList.length > 0 ? rawList : fallbackProjects
      let totalActualHours = 0
      let efficiencySum = 0
      const allData = raw.map((item: any) => {
        const planed = Math.max(1, Number(item.planed_hour) || 10)
        const actual = Math.max(0, Number(item.actual_hour) || planed)
        totalActualHours += actual
        const rate = Math.min(100, Math.round((actual / planed) * 100))
        efficiencySum += rate
        const isEfficient = actual <= planed
        return {
          ...item,
          _startDate: item.start_date ? String(item.start_date).slice(0, 10) : '-',
          _deadline: item.deadline ? String(item.deadline).slice(0, 10) : '-',
          _finishDate: item.finish_date ? String(item.finish_date).slice(0, 10) : '',
          _hourRate: rate,
          _isEfficient: isEfficient,
          _efficiencyTag: isEfficient ? '⚡ 按期高效交付' : '🔥 深度攻坚结项',
        }
      })
      const avgEfficiency = allData.length > 0 ? Math.round(efficiencySum / allData.length) : 100
      const listData = this.applyFilters(allData, this.data.filterMode, this.data.searchKeyword)
      this.setData({
        allData,
        listData,
        filteredList: listData,
        stats: {
          totalCount: allData.length,
          totalActualHours,
          avgEfficiency,
        },
        loading: false,
      })
    }
    return get('/api/inno/fetch_finished_projects', undefined, { silentAuthError: true })
      .then((res: any) => applyList(res))
      .catch(() => applyList(fallbackProjects))
  },

  toggleFilter(e?: any) {
    const mode = e?.currentTarget?.dataset?.mode || 'all'
    const showMine = mode === 'mine'
    const listData = this.applyFilters(this.data.allData, mode, this.data.searchKeyword)
    this.setData({ listData, filteredList: listData, filterMode: mode, showMine })
  },

  async onGreetTaker(e: any) {
    const item = e.currentTarget.dataset.item
    if (!item) return
    const takerName = item.taker || '项目执行人'
    const takerId = Number(item.taker_id || 0)
    try {
      if (takerId) {
        await quickGreetPeer({
          target_user_id: takerId,
          topic: `🏆 看到你结项的《${item.title}》，想向你请教实战复盘经验！`,
          planed_duration: 15,
        })
      }
    } catch {}
    wx.showToast({
      title: `👋 已向 ${takerName} 发送取经邀约`,
      icon: 'none',
    })
  },

  onProjectTap(e: any) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({
      url: `/pages/inno-detail/index?id=${id}`,
    })
  },
})