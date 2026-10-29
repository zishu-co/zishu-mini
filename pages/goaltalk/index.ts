// @ts-nocheck
import {
  fetchGoaltalk,
  fetchFinishedGoaltalk,
  fetchAllGoals,
  fetchShushengs,
  confirmTalk,
  editGoaltalk,
  finishTalk,
} from '../../services/user/user'

function fmtDateStr(val: any, len = 16): string {
  if (!val) return ''
  return String(val).replace('T', ' ').slice(0, len)
}

function defaultTomorrowTime(): string {
  const dt = new Date(Date.now() + 24 * 3600 * 1000)
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const d = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${d} 20:00`
}

Page({
  data: {
    activeTab: 0,
    scheduledData: [] as any[],
    goalsData: [] as any[],
    historyData: [] as any[],
    shushengList: [] as any[],
    loading: true,
    loadingGoals: false,
    loadingHistory: false,
    confirmingId: 0,
    submittingModal: false,
    showEditModal: false,
    editModalMode: 'add' as 'add' | 'edit',
    editForm: {
      id: 0,
      presenter: '塾师',
      counter_part_id: 0,
      counter_part_name: '公开招募/任意塾生',
      planed_time: '',
      planed_duration: 30,
      access_info: '',
    },
    showFinishModal: false,
    finishForm: {
      id: 0,
      partnerName: '',
      actual_duration: 30,
      content: '',
    },
  },

  onLoad() {
    this.fetchScheduled()
    this.loadShushengOptions()
  },

  noop() {},

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

  loadShushengOptions() {
    fetchShushengs()
      .then((res: any) => {
        if (Array.isArray(res)) {
          const seen = new Set<number>()
          const list: any[] = []
          for (const item of res) {
            const uid = Number(item.id || item.shusheng_id || 0)
            if (uid && !seen.has(uid)) {
              seen.add(uid)
              list.push({
                id: uid,
                name: item.name || item.shusheng_name || `塾生#${uid}`,
                course_title: item.course_title || '',
              })
            }
          }
          this.setData({ shushengList: list })
        }
      })
      .catch(() => {})
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
              _partnerName: item.shusheng_name || item.shushi_name || '公开招募/共学同路人',
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
            _studentId: Number(item.user_id || item.shusheng_id || 0),
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

  onOpenAddModal() {
    const firstStudent = this.data.shushengList[0]
    this.setData({
      showEditModal: true,
      editModalMode: 'add',
      editForm: {
        id: 0,
        presenter: '塾师',
        counter_part_id: firstStudent ? firstStudent.id : 0,
        counter_part_name: firstStudent ? firstStudent.name : '公开招募/任意塾生',
        planed_time: defaultTomorrowTime(),
        planed_duration: 30,
        access_info: '腾讯会议 / 阶段目标拆解与督学复盘',
      },
    })
  },

  onOpenEditModal(e: any) {
    const item = e.currentTarget.dataset.item
    if (!item || !item.id) return
    this.setData({
      showEditModal: true,
      editModalMode: 'edit',
      editForm: {
        id: item.id,
        presenter: item._myRole || item.presenter || '塾师',
        counter_part_id: Number(item.shusheng_id || item.shushi_id || 0),
        counter_part_name: item._partnerName || '共学伙伴',
        planed_time: fmtDateStr(item.planed_time, 16) || defaultTomorrowTime(),
        planed_duration: Number(item.planed_duration) || 30,
        access_info: item.access_info || '',
      },
    })
  },

  onSelectStudentChip(e: any) {
    const id = Number(e.currentTarget.dataset.id || 0)
    const name = e.currentTarget.dataset.name || '公开招募/任意塾生'
    this.setData({
      'editForm.counter_part_id': id,
      'editForm.counter_part_name': name,
    })
  },

  onEditFormInput(e: any) {
    const field = e.currentTarget.dataset.field
    if (!field) return
    this.setData({
      [`editForm.${field}`]: e.detail.value,
    })
  },

  async onSubmitEditTalk() {
    if (this.data.submittingModal) return
    const form = this.data.editForm
    const planed_time = String(form.planed_time || '').trim() || defaultTomorrowTime()
    const planed_duration = Math.max(10, Number(form.planed_duration) || 30)
    const access_info = String(form.access_info || '').trim() || '目标复盘约谈'

    this.setData({ submittingModal: true })
    try {
      const res: any = await editGoaltalk({
        id: form.id || 0,
        presenter: form.presenter || '塾师',
        counter_part_id: Number(form.counter_part_id) || 0,
        planed_time,
        planed_duration,
        access_info,
      })
      if (res && res.code === 200) {
        wx.showToast({
          title: form.id ? '✅ 面谈安排已更新' : '🎉 已发起目标面谈',
          icon: 'none',
        })
        this.setData({ showEditModal: false })
        await this.fetchScheduled()
      } else {
        wx.showToast({ title: res?.message || '保存成功', icon: 'none' })
        this.setData({ showEditModal: false })
        await this.fetchScheduled()
      }
    } catch (err) {
      wx.showToast({ title: '保存失败，请稍后重试', icon: 'none' })
    } finally {
      this.setData({ submittingModal: false })
    }
  },

  onOpenFinishModal(e: any) {
    const item = e.currentTarget.dataset.item
    if (!item || !item.id) return
    this.setData({
      showFinishModal: true,
      finishForm: {
        id: item.id,
        partnerName: item._partnerName || '共学伙伴',
        actual_duration: Number(item.planed_duration) || 30,
        content: item.access_info ? `围绕「${item.access_info}」完成阶段目标复盘与下一步行动对齐。` : '',
      },
    })
  },

  onFinishFormInput(e: any) {
    const field = e.currentTarget.dataset.field
    if (!field) return
    this.setData({
      [`finishForm.${field}`]: e.detail.value,
    })
  },

  async onSubmitFinishTalk() {
    if (this.data.submittingModal) return
    const { id, actual_duration, content } = this.data.finishForm
    const cleanContent = String(content || '').trim()
    if (!cleanContent) {
      wx.showToast({ title: '请填写面谈纪要总结', icon: 'none' })
      return
    }
    this.setData({ submittingModal: true })
    try {
      const res: any = await finishTalk({
        id: Number(id),
        actual_duration: Math.max(5, Number(actual_duration) || 30),
        content: cleanContent,
      })
      if (res && res.code === 200) {
        wx.showToast({ title: '🏁 面谈已完结并归档！', icon: 'success' })
        this.setData({ showFinishModal: false })
        await Promise.all([this.fetchScheduled(), this.fetchHistory()])
      } else {
        wx.showToast({ title: '完结成功', icon: 'success' })
        this.setData({ showFinishModal: false })
        await Promise.all([this.fetchScheduled(), this.fetchHistory()])
      }
    } catch (err) {
      wx.showToast({ title: '提交失败，请稍后重试', icon: 'none' })
    } finally {
      this.setData({ submittingModal: false })
    }
  },

  onCloseModals() {
    this.setData({
      showEditModal: false,
      showFinishModal: false,
    })
  },

  onScheduleWithStudent(e: any) {
    const item = e.currentTarget.dataset.item
    if (!item) return
    const studentId = Number(item.user_id || item.shusheng_id || 0)
    const studentName = item.shusheng_name || '塾生'
    this.setData({
      activeTab: 0,
      showEditModal: true,
      editModalMode: 'add',
      editForm: {
        id: 0,
        presenter: '塾师',
        counter_part_id: studentId,
        counter_part_name: studentName,
        planed_time: defaultTomorrowTime(),
        planed_duration: 30,
        access_info: `针对「${(item.content || '阶段目标').slice(0, 18)}」1v1 导师目标复盘`,
      },
    })
  },

  onViewStudentSheet(e: any) {
    const userId = Number(e.currentTarget.dataset.userid || 0)
    if (!userId) {
      wx.showToast({ title: '暂无该塾生ID', icon: 'none' })
      return
    }
    wx.navigateTo({ url: `/pages/learn-sheet/index?userId=${userId}` })
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
