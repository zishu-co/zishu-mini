// @ts-nocheck
import {
  fetchGoaltalk,
  fetchFinishedGoaltalk,
  fetchAllGoals,
  confirmTalk,
} from '../../services/user/user'

function fmtDateStr(val: any, len = 16): string {
  if (!val) return ''
  return String(val).replace('T', ' ').slice(0, len)
}

Page({
  data: {
    activeTab: 0,
    scheduledData: [] as any[],
    goalsData: [] as any[],
    historyData: [] as any[],
    loading: true,
    loadingGoals: false,
    loadingHistory: false,
    confirmingId: 0,
  },

  onLoad() {
    this.fetchScheduled()
  },

  onPullDownRefresh() {
    if (this.data.activeTab === 0) {
      this.fetchScheduled().finally(() => wx.stopPullDownRefresh())
    } else if (this.data.activeTab === 1) {
      this.fetchGoals().finally(() => wx.stopPullDownRefresh())
    } else {
      this.fetchHistory().finally(() => wx.stopPullDownRefresh())
    }
  },

  onShareAppMessage() {
    return {
      title: '🎯 自塾目标约谈中心 · 1v1 导师领航与同路人目标复盘',
      path: '/pages/goaltalk/index',
    }
  },

  switchTab(e: any) {
    const tab = parseInt(e.currentTarget.dataset.tab, 10)
    this.setData({ activeTab: tab })
    if (tab === 1 && this.data.goalsData.length === 0) {
      this.fetchGoals()
    } else if (tab === 2 && this.data.historyData.length === 0) {
      this.fetchHistory()
    }
  },

  fetchScheduled() {
    this.setData({ loading: true })
    return Promise.all([
      fetchGoaltalk('塾师').catch(() => []),
      fetchGoaltalk('塾生').catch(() => []),
    ])
      .then(([asMentor, asStudent]: any[]) => {
        const listA = Array.isArray(asMentor)
          ? asMentor.map((x: any) => ({ ...x, _myRole: '塾师' }))
          : []
        const listB = Array.isArray(asStudent)
          ? asStudent.map((x: any) => ({ ...x, _myRole: '塾生' }))
          : []
        const seen = new Set<number>()
        const merged: any[] = []
        for (const item of [...listA, ...listB]) {
          if (item && item.id && !seen.has(item.id)) {
            seen.add(item.id)
            merged.push({
              ...item,
              _partnerName: item.shusheng_name || item.shushi_name || '共学同路人',
              _roleTag: item._myRole === '塾师' ? '受邀导师' : '我的预约',
              _statusClass: this.getStatusClass(item),
              _statusText: this.getStatusText(item),
              _planedTimeStr: fmtDateStr(item.planed_time, 16) || '待定',
              _confirmedTimeStr: fmtDateStr(item.confirmed_time, 16),
              _canConfirm: !item.confirmer,
            })
          }
        }
        this.setData({ scheduledData: merged, loading: false })
      })
      .catch(() => {
        this.setData({ scheduledData: [], loading: false })
      })
  },

  fetchGoals() {
    this.setData({ loadingGoals: true })
    return fetchAllGoals('塾师')
      .then((res: any) => {
        const raw = Array.isArray(res) ? res : []
        const goalsData = raw.map((item: any) => {
          const proc = Number(item.process) || 0
          const pct = proc <= 10 ? proc * 10 : proc
          return {
            ...item,
            _progressText: item.content ? `进度 ${pct}%` : '暂未立项',
            _startDate: fmtDateStr(item.start_time, 10),
            _deadline: fmtDateStr(item.deadline, 10),
            _shortContent: item.content ? String(item.content).slice(0, 60) : '该塾生暂未填写阶段目标',
          }
        })
        this.setData({ goalsData, loadingGoals: false })
      })
      .catch(() => {
        this.setData({ goalsData: [], loadingGoals: false })
      })
  },

  fetchHistory() {
    this.setData({ loadingHistory: true })
    return Promise.all([
      fetchFinishedGoaltalk('塾师').catch(() => []),
      fetchFinishedGoaltalk('塾生').catch(() => []),
    ])
      .then(([asMentor, asStudent]: any[]) => {
        const listA = Array.isArray(asMentor) ? asMentor : []
        const listB = Array.isArray(asStudent) ? asStudent : []
        const seen = new Set<number>()
        const merged: any[] = []
        for (const item of [...listA, ...listB]) {
          if (item && item.id && !seen.has(item.id)) {
            seen.add(item.id)
            merged.push({
              ...item,
              _partnerName: item.shusheng_name || item.shushi_name || '共学伙伴',
              _finishTimeStr: fmtDateStr(item.finish_time, 16),
              _summary: item.content ? String(item.content).slice(0, 72) : '已完成共学面谈复盘',
            })
          }
        }
        this.setData({ historyData: merged, loadingHistory: false })
      })
      .catch(() => {
        this.setData({ historyData: [], loadingHistory: false })
      })
  },

  async onConfirmTalk(e: any) {
    const item = e.currentTarget.dataset.item
    if (!item || !item.id || this.data.confirmingId) return
    this.setData({ confirmingId: item.id })
    try {
      const res: any = await confirmTalk({
        id: item.id,
        confirmer: item._myRole || '塾师',
      })
      if (res && res.code === 200) {
        wx.showToast({ title: '🎉 已确认赴约！', icon: 'success' })
        await this.fetchScheduled()
      } else {
        wx.showToast({ title: '确认成功', icon: 'success' })
        await this.fetchScheduled()
      }
    } catch (err) {
      wx.showToast({ title: '操作失败，请稍后重试', icon: 'none' })
    } finally {
      this.setData({ confirmingId: 0 })
    }
  },

  onCopyAccess(e: any) {
    const info = e.currentTarget.dataset.info
    if (!info) return
    wx.setClipboardData({
      data: String(info),
      success: () => {
        wx.showToast({ title: '已复制面谈入口/主题', icon: 'success' })
      },
    })
  },

  onGoSocialPlaza() {
    wx.navigateTo({ url: '/pages/all/index' })
  },

  viewDetail(e: any) {
    const item = e.currentTarget.dataset.item
    if (!item) return
    let msg = `共学伙伴: ${item._partnerName || item.shusheng_name || '群发'}\n`
    msg += `预定时间: ${item._planedTimeStr || item.planed_time || '-'}\n`
    msg += `计划时长: ${item.planed_duration || 15} 分钟\n`
    if (item._confirmedTimeStr) msg += `确认时间: ${item._confirmedTimeStr}\n`
    if (item.access_info) msg += `面谈主题/入口: ${item.access_info}`
    wx.showModal({
      title: '💬 面谈预约详情',
      content: msg,
      showCancel: false,
    })
  },

  viewContent(e: any) {
    const { content, title } = e.currentTarget.dataset
    if (content) {
      wx.showModal({
        title: title || '详情',
        content: String(content),
        showCancel: false,
      })
    }
  },

  getStatusClass(item: any): string {
    if (item.confirmer || item.confirmed_time) return 'confirmed'
    if (item.planed_time) {
      const now = Date.now()
      const planed = new Date(item.planed_time).getTime()
      if (!isNaN(planed) && planed < now) return 'overdue'
      return 'pending'
    }
    return 'pending'
  },

  getStatusText(item: any): string {
    if (item.confirmer || item.confirmed_time) return '已确认赴约'
    if (item.planed_time) {
      const now = Date.now()
      const planed = new Date(item.planed_time).getTime()
      if (!isNaN(planed) && planed < now) return '待复盘'
      return '待确认'
    }
    return '待安排'
  },
})
