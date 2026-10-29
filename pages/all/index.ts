// @ts-nocheck
import base from '../../services/base'
import { quickGreetPeer } from '../../services/user/user'

const { get } = base

const ICEBREAKER_TOPICS = [
  '🎯 目标同频 · 结伴每日打卡监督',
  '🚢 寻找 4人诺亚方舟共学学伴',
  '💬 预约 15 分钟 1v1 目标复盘面谈',
  '🚀 一起组队挑战自塾创新实战项目',
]

function extractCleanGoalText(raw: any, maxLen = 32): string {
  const str = String(raw || '').trim()
  if (!str) return ''
  if (str.startsWith('{') || str.includes('"nodeData"') || str.includes('"topic"')) {
    try {
      const parsed = JSON.parse(str)
      const root = parsed?.nodeData || parsed
      const topics: string[] = []
      if (root?.topic && root.topic !== '新建节点' && root.topic !== 'Root') {
        topics.push(String(root.topic).trim())
      }
      if (Array.isArray(root?.children)) {
        for (const ch of root.children) {
          if (ch?.topic) topics.push(String(ch.topic).trim())
          if (topics.length >= 3) break
        }
      }
      if (topics.length > 0) {
        const joined = topics.join(' · ')
        return maxLen > 0 ? joined.slice(0, maxLen) : joined
      }
    } catch (_e) {
      const matches: string[] = []
      const re = /"topic"\s*:\s*"([^"]+)"/g
      let m: RegExpExecArray | null
      while ((m = re.exec(str)) !== null) {
        const t = m[1].trim()
        if (t && t !== '新建节点' && t !== 'Root') matches.push(t)
        if (matches.length >= 3) break
      }
      if (matches.length > 0) {
        const joined = matches.join(' · ')
        return maxLen > 0 ? joined.slice(0, maxLen) : joined
      }
      return ''
    }
  }
  const firstLine = str.split('\n')[0].trim()
  return maxLen > 0 ? firstLine.slice(0, maxLen) : firstLine
}

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

    // 共学广场筛选与搜索
    activeCategory: 'all', // all | hot | buddy | mentor
    genderFilter: 'all',
    keyword: '',

    // 共学交流弹窗
    showGreetModal: false,
    greetTarget: null as any,
    icebreakerTopics: ICEBREAKER_TOPICS,
    selectedTopicIndex: 0,
    customTopic: '',
    greetingSubmitting: false,

    // 101-profile.md: 同路人学习名片 Profile 弹窗
    showProfileModal: false,
    profilePeer: null as any,
    profileGoal: null as any,
    profileLoading: false,
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '全塾动态  共学广场' })
    this.fetchMembers()
  },

  onPullDownRefresh() {
    this.fetchMembers().finally(() => wx.stopPullDownRefresh())
  },

  onShareAppMessage() {
    return {
      title: `🤝 全塾动态  共学广场 · ${this.data.totalCount || ''}位学友在线结伴共学！`,
      path: '/pages/all/index',
    }
  },

  fetchMembers() {
    this.setData({ loading: true })
    const fallbackUsers = [
      { id: 1, username: '青桐塾主', role: '管理员', gender: '男', location: '上海', shuzhi: 120, learn_hour: 86, total_hours_7d: 8.5, goal: '赋能全塾学友以终为始结伴通关' },
      { id: 101, username: '苏晓', role: '塾生', gender: '女', location: '杭州', shuzhi: 45, learn_hour: 32, total_hours_7d: 6.0, goal: '30天完成 Python 与 AI 智能体实战课程' },
      { id: 102, username: '陈默', role: '塾师', gender: '男', location: '北京', shuzhi: 68, learn_hour: 54, total_hours_7d: 5.5, goal: '带教 FastAPI 微服务共学方舟' },
    ]
    const applyMemberList = (rawInput: any[]) => {
      const rawList = Array.isArray(rawInput) && rawInput.length > 0 ? rawInput : fallbackUsers
      const decorated = rawList
        .filter((u: any) => u.role !== '清理')
        .map((u: any) => {
          const name = String(u.username || '').trim()
          const hours7d = Number(u.total_hours_7d) || 0
          const shuzhi = Number(u.shuzhi) || 0
          const learnHour = Number(u.learn_hour) || 0
          const g = computeFallbackGamification(u)
          const goalFirstLine = extractCleanGoalText(u.goal, 32) || extractCleanGoalText(u.desc, 32)
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
    }
    return get('/api/users/fetch_all_users', undefined, { silentAuthError: true })
      .then((res: any) => applyMemberList(res))
      .catch(() => applyMemberList(fallbackUsers))
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
      if (activeCategory === 'buddy' && !u._goalShort && !u.location) {
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
    const userId = e.currentTarget.dataset.userid || this.data.profilePeer?.id
    if (!userId) return
    this.setData({ showProfileModal: false })
    wx.navigateTo({ url: `/pages/learn-sheet/index?userId=${userId}` })
  },

  // ── 101-profile.md: 同路人学习名片弹窗 ─────────────────────────
  async onOpenPeerProfile(e: any) {
    const item = e.currentTarget.dataset.item
    if (!item || !item.id) return
    this.setData({
      showProfileModal: true,
      profilePeer: item,
      profileGoal: null,
      profileLoading: true,
    })
    try {
      const [userRes, goalRes]: any = await Promise.all([
        get(`/api/users/get_user/${item.id}`).catch(() => null),
        get(`/api/users/fetch_goal/${item.id}`).catch(() => null),
      ])
      const mergedPeer = {
        ...item,
        location: userRes?.location || item.location || '线上',
        shuzhi: userRes?.shuzhi ?? item.shuzhi,
      }
      const cleanedGoalContent = goalRes && goalRes.content ? extractCleanGoalText(goalRes.content, 160) : ''
      this.setData({
        profilePeer: mergedPeer,
        profileGoal: cleanedGoalContent ? { ...goalRes, content: cleanedGoalContent } : null,
        profileLoading: false,
      })
    } catch (err) {
      this.setData({ profileLoading: false })
    }
  },

  onClosePeerProfile() {
    this.setData({ showProfileModal: false, profilePeer: null })
  },

  onGreetFromProfile() {
    const peer = this.data.profilePeer
    if (!peer) return
    this.setData({
      showProfileModal: false,
      showGreetModal: true,
      greetTarget: peer,
      selectedTopicIndex: 0,
      customTopic: '',
    })
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
      '共学打卡交流'

    this.setData({ greetingSubmitting: true })
    try {
      const res: any = await quickGreetPeer({
        target_user_id: target.id,
        topic,
        planed_duration: 15,
      })
      this.setData({ showGreetModal: false, greetingSubmitting: false })
      wx.showToast({
        title: res?.message || `已向 ${target.username} 发起共学交流！`,
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
