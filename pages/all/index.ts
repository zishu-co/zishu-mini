// @ts-nocheck
import base from '../../services/base'
import { quickGreetPeer } from '../../services/user/user'

const { get } = base

const ICEBREAKER_TOPICS = [
  '🎯 目标同频 · 结伴每日打卡监督',
  '🚢 寻找 2男2女诺亚方舟共学搭子',
  '💬 预约 15 分钟 1v1 目标破冰面谈',
  '🚀 一起组队挑战自塾创新实战项目',
]

function computeFallbackGamification(u: any) {
  const sz = Number(u.shuzhi) || 0
  const lh = Number(u.learn_hour) || 0
  const h7 = Number(u.total_hours_7d) || 0
  if (u.level_title && u.level_badge) {
    return {
      levelTitle: u.level_title,
      levelBadge: u.level_badge,
      levelNum: Number(u.level_num) || 1,
    }
  }
  if (sz >= 100 || lh >= 100) return { levelTitle: '自塾宗师', levelBadge: '👑', levelNum: 5 }
  if (sz >= 50 || lh >= 50 || u.role === '管理员' || u.role === '塾师') {
    return { levelTitle: '领航塾师', levelBadge: '💎', levelNum: 4 }
  }
  if (sz >= 20 || lh >= 20 || h7 >= 5) return { levelTitle: '荣耀学霸', levelBadge: '🔥', levelNum: 3 }
  if (sz >= 10 || lh >= 5 || h7 > 0) return { levelTitle: '进阶行者', levelBadge: '⚡', levelNum: 2 }
  return { levelTitle: '初心学徒', levelBadge: '🌱', levelNum: 1 }
}

Page({
  data: {
    allMembers: [] as any[],
    members: [] as any[],
    loading: true,
    totalCount: 0,
    activeCount: 0,
    inactiveCount: 0,
    hot7dCount: 0,

    // 交友广场筛选与搜索
    activeCategory: 'all', // all | hot | buddy | mentor
    genderFilter: 'all', // all | 女 | 男
    keyword: '',

    // 破冰约聊弹窗
    showGreetModal: false,
    greetTarget: null as any,
    icebreakerTopics: ICEBREAKER_TOPICS,
    selectedTopicIndex: 0,
    customTopic: '',
    greetingSubmitting: false,
  },

  onLoad() {
    this.fetchMembers()
  },

  onPullDownRefresh() {
    this.fetchMembers().finally(() => wx.stopPullDownRefresh())
  },

  fetchMembers() {
    this.setData({ loading: true })
    return get('/api/users/fetch_all_users')
      .then((res: any) => {
        const rawList = Array.isArray(res) ? res : []
        const decorated = rawList
          .filter((u: any) => u.role !== '清理')
          .map((u: any) => {
            const name = String(u.username || '').trim()
            const hours7d = Number(u.total_hours_7d) || 0
            const shuzhi = Number(u.shuzhi) || 0
            const learnHour = Number(u.learn_hour) || 0
            const g = computeFallbackGamification(u)
            const goalRaw = String(u.goal || u.desc || '').trim()
            const goalFirstLine = goalRaw ? goalRaw.split('\n')[0].slice(0, 32) : ''
            return {
              ...u,
              _avatarChar: name ? name.slice(0, 1) : '塾',
              _hours7d: hours7d,
              _hours7dStr: hours7d > 0 ? hours7d.toFixed(1) : '',
              _shuzhiStr: Math.round(shuzhi * 10) / 10,
              _learnHourStr: Math.round(learnHour * 10) / 10,
              _levelTitle: g.levelTitle,
              _levelBadge: g.levelBadge,
              _levelNum: g.levelNum,
              _genderClass: u.gender === '女' ? 'female' : u.gender === '男' ? 'male' : 'neutral',
              _genderLabel: u.gender === '女' ? '🚺 女生' : u.gender === '男' ? '🚹 男生' : '',
              _goalShort: goalFirstLine,
              _isActive: shuzhi >= 10 || hours7d > 0,
            }
          })

        const totalCount = decorated.length
        const activeCount = decorated.filter((u: any) => u._isActive).length
        const inactiveCount = Math.max(0, totalCount - activeCount)
        const hot7dCount = decorated.filter((u: any) => u._hours7d > 0).length

        this.setData(
          {
            allMembers: decorated,
            totalCount,
            activeCount,
            inactiveCount,
            hot7dCount,
            loading: false,
          },
          () => {
            this.applyFilters()
          }
        )
      })
      .catch(() => {
        this.setData({
          allMembers: [],
          members: [],
          totalCount: 0,
          activeCount: 0,
          inactiveCount: 0,
          hot7dCount: 0,
          loading: false,
        })
      })
  },

  applyFilters() {
    const { allMembers, activeCategory, genderFilter, keyword } = this.data
    const kw = (keyword || '').trim().toLowerCase()

    let list = allMembers.filter((u: any) => {
      if (genderFilter !== 'all' && u.gender !== genderFilter) {
        return false
      }
      if (activeCategory === 'hot' && u._hours7d <= 0 && (u.shuzhi || 0) < 15) {
        return false
      }
      if (activeCategory === 'buddy' && !u.gender && !u._goalShort) {
        return false
      }
      if (activeCategory === 'mentor' && u._levelNum < 3 && u.role !== '塾师' && u.role !== '管理员') {
        return false
      }
      if (kw) {
        const hay = `${u.username || ''} ${u.location || ''} ${u._goalShort || ''} ${u._levelTitle || ''}`.toLowerCase()
        if (hay.indexOf(kw) === -1) return false
      }
      return true
    })

    if (activeCategory === 'hot') {
      list = list.slice().sort((a: any, b: any) => b._hours7d - a._hours7d || (b.shuzhi || 0) - (a.shuzhi || 0))
    } else if (activeCategory === 'mentor') {
      list = list.slice().sort((a: any, b: any) => (b.shuzhi || 0) - (a.shuzhi || 0))
    }

    this.setData({ members: list })
  },

  onCategoryTap(e: any) {
    const cat = e.currentTarget.dataset.cat
    if (!cat || cat === this.data.activeCategory) return
    this.setData({ activeCategory: cat }, () => this.applyFilters())
  },

  onGenderFilterTap(e: any) {
    const g = e.currentTarget.dataset.gender
    if (!g || g === this.data.genderFilter) return
    this.setData({ genderFilter: g }, () => this.applyFilters())
  },

  onKeywordInput(e: any) {
    this.setData({ keyword: e.detail.value || '' }, () => this.applyFilters())
  },

  onClearKeyword() {
    this.setData({ keyword: '' }, () => this.applyFilters())
  },

  onViewLearnSheet(e: any) {
    const userId = e.currentTarget.dataset.userid
    if (!userId) return
    wx.navigateTo({ url: `/pages/learn-sheet/index?userId=${userId}` })
  },

  onOpenGreetModal(e: any) {
    const item = e.currentTarget.dataset.item
    if (!item) return
    this.setData({
      showGreetModal: true,
      greetTarget: item,
      selectedTopicIndex: 0,
      customTopic: '',
    })
  },

  onCloseGreetModal() {
    this.setData({ showGreetModal: false, greetTarget: null })
  },

  onSelectTopic(e: any) {
    const idx = Number(e.currentTarget.dataset.index || 0)
    this.setData({ selectedTopicIndex: idx })
  },

  onCustomTopicInput(e: any) {
    this.setData({ customTopic: e.detail.value || '' })
  },

  async onSendGreet() {
    if (this.data.greetingSubmitting || !this.data.greetTarget) return
    const target = this.data.greetTarget
    const topic =
      (this.data.customTopic || '').trim() ||
      this.data.icebreakerTopics[this.data.selectedTopicIndex] ||
      '共学破冰约聊'

    this.setData({ greetingSubmitting: true })
    try {
      const res: any = await quickGreetPeer({
        target_user_id: target.id,
        topic,
        planed_duration: 15,
      })
      this.setData({ showGreetModal: false, greetingSubmitting: false })
      wx.showToast({
        title: res?.message || `已向 ${target.username} 发起破冰约聊！`,
        icon: 'none',
        duration: 2200,
      })
    } catch (err: any) {
      this.setData({ showGreetModal: false, greetingSubmitting: false })
      wx.showToast({
        title: `👋 已向 ${target.username} 发送共学问候！`,
        icon: 'none',
        duration: 2000,
      })
    }
  },
})
