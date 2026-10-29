// @ts-nocheck
// pages/event/index.ts
// 活动列表页（普通用户视角）
// spec: specs/port/archive/006-port-event-list.md
import {
  fetchCurrentEvents,
  fetchHistoricalEvents,
  fetchMyActivities,
  joinEvent,
  createCommunityEvent,
  selfSignInEvent,
  EventItem,
} from '../../services/event/event';

const app = getApp();

interface IEventPageData {
  activeTab: 'current' | 'historical' | 'mine';
  currentEvents: EventItem[];
  historicalEvents: EventItem[];
  myActivities: any[];
  filteredCurrentEvents: EventItem[];
  filteredHistoricalEvents: EventItem[];
  searchKeyword: string;
  loading: boolean;
  hasLogin: boolean;
  joiningId: number;
  signingInId: number;
  // 100-event-form.md: 发起共学活动弹窗
  showCreateModal: boolean;
  creatingEvent: boolean;
  createForm: {
    title: string;
    location: string;
    startDate: string;
    startTime: string;
    url: string;
    desc: string;
  };
}

Page<IEventPageData, any>({
  data: {
    activeTab: 'current',
    currentEvents: [],
    historicalEvents: [],
    myActivities: [],
    filteredCurrentEvents: [],
    filteredHistoricalEvents: [],
    searchKeyword: '',
    loading: true,
    hasLogin: false,
    joiningId: 0,
    signingInId: 0,
    showCreateModal: false,
    creatingEvent: false,
    createForm: {
      title: '',
      location: '',
      startDate: '',
      startTime: '14:00',
      url: '',
      desc: '',
    },
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().init();
    }
    this.checkLogin();
  },

  onLoad() {
    this.loadEvents();
  },

  onPullDownRefresh() {
    this.loadEvents().then(() => wx.stopPullDownRefresh());
  },

  onShareAppMessage() {
    return {
      title: '🎉 自塾同城活动与线下共学 · 快来报名参与学习交流！',
      path: '/pages/event/index',
    };
  },

  decorateEvent(ev: any) {
    const count = Number(ev?.participant_count || 0);
    return {
      ...ev,
      _heatBadge: count >= 10 ? '🔥 热门共学活动' : '✨ 报名进行中',
      _startDateStr: ev?.start_time ? String(ev.start_time).slice(0, 16).replace('T', ' ') : '待定',
    };
  },

  /** 加载活动列表（同时拉当前 + 历史 + 我的参与） */
  async loadEvents() {
    this.setData({ loading: true });
    try {
      const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
      const [current, historical, myActs] = await Promise.all([
        fetchCurrentEvents().catch(() => []),
        fetchHistoricalEvents().catch(() => []),
        token ? fetchMyActivities().catch(() => []) : Promise.resolve([]),
      ]);
      const currentEvents = Array.isArray(current) ? current.map((e) => this.decorateEvent(e)) : [];
      const historicalEvents = Array.isArray(historical) ? historical.map((e) => this.decorateEvent(e)) : [];
      const myActivities = Array.isArray(myActs) ? myActs.map((e) => this.decorateEvent(e)) : [];
      this.setData({
        currentEvents,
        historicalEvents,
        myActivities,
        loading: false,
      });
      this.applySearch(this.data.searchKeyword, currentEvents, historicalEvents);
    } catch (e) {
      console.error('loadEvents failed', e);
      this.setData({ loading: false });
      wx.showToast({ title: '加载活动列表失败，请稍后重试', icon: 'none' });
    }
  },

  onSearchInput(e: any) {
    const kw = (e?.detail?.value ?? '').trim();
    this.applySearch(kw);
  },

  onClearSearch() {
    this.applySearch('');
  },

  applySearch(
    keyword: string,
    currentList = this.data.currentEvents,
    historicalList = this.data.historicalEvents
  ) {
    const kw = (keyword || '').toLowerCase();
    const matchFn = (ev: any) => {
      if (!kw) return true;
      const title = String(ev?.title || '').toLowerCase();
      const loc = String(ev?.location || '').toLowerCase();
      const desc = String(ev?.desc || '').toLowerCase();
      return title.includes(kw) || loc.includes(kw) || desc.includes(kw);
    };
    this.setData({
      searchKeyword: keyword,
      filteredCurrentEvents: (currentList || []).filter(matchFn),
      filteredHistoricalEvents: (historicalList || []).filter(matchFn),
    });
  },

  /** 检查登录态 */
  checkLogin() {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    this.setData({ hasLogin: !!token });
  },

  /** 切换 tab */
  onTabChange(e: any) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.activeTab) return;
    this.setData({ activeTab: tab });
  },

  /** 跳参与者列表 */
  onCardTap(e: any) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({
      url: `/pages/event/participants/index?id=${id}`,
    });
  },

  /** 海报点击 → 跳 webview 公众号文章 */
  onPosterTap(e: any) {
    e.stopPropagation && e.stopPropagation();
    const url = e.currentTarget.dataset.url;
    if (!url) {
      wx.showToast({ title: '暂无宣传链接', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/event/webview/index?url=${encodeURIComponent(url)}`,
    });
  },

  /** 报名参加 */
  async onJoinTap(e: any) {
    e.stopPropagation && e.stopPropagation();
    if (!this.data.hasLogin) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再报名',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/login' });
          }
        },
      });
      return;
    }
    const id = e.currentTarget.dataset.id;
    const title = e.currentTarget.dataset.title;
    if (!id || this.data.joiningId === id) return;
    const res = await wx.showModal({
      title: '报名确认',
      content: '请先确认您已在「活动行」或「粗门」平台完成报名，再点击确认加入',
      confirmText: '已报名，确认加入',
      cancelText: '取消',
    });
    if (!res.confirm) return;
    this.setData({ joiningId: id });
    try {
      const result = await joinEvent(id);
      if (result && result.code === '200') {
        wx.showToast({ title: '报名成功！', icon: 'success' });
        // 重新加载以更新参与人数
        setTimeout(() => this.loadEvents(), 800);
      } else {
        wx.showToast({ title: result?.message || '报名失败', icon: 'none' });
      }
    } catch (err: any) {
      console.error('joinEvent failed', err);
      wx.showToast({ title: err?.message || '报名失败', icon: 'none' });
    } finally {
      this.setData({ joiningId: 0 });
    }
  },

  // ── 102-participant-list.md: 活动现场签到打卡 ──────────────────
  async onSignInTap(e: any) {
    e.stopPropagation && e.stopPropagation();
    const eventId = Number(e.currentTarget.dataset.id || 0);
    const participantId = Number(e.currentTarget.dataset.pid || 0);
    if (!eventId && !participantId) return;
    this.setData({ signingInId: eventId || participantId });
    try {
      const res = await selfSignInEvent({
        event_id: eventId || undefined,
        participant_id: participantId || undefined,
      });
      if (res && res.code === '200') {
        wx.showToast({ title: '现场签到成功 🎉', icon: 'success' });
        this.loadEvents();
      } else {
        wx.showToast({ title: res?.message || '签到失败', icon: 'none' });
      }
    } catch (err: any) {
      wx.showToast({ title: '请先报名该活动再签到', icon: 'none' });
    } finally {
      this.setData({ signingInId: 0 });
    }
  },

  // ── 100-event-form.md: 发起同城共学活动 ────────────────────────
  onOpenCreateModal() {
    if (!this.data.hasLogin) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    const tomorrow = new Date(Date.now() + 86400000);
    const dateStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    this.setData({
      showCreateModal: true,
      createForm: {
        title: '',
        location: '',
        startDate: dateStr,
        startTime: '14:00',
        url: '',
        desc: '',
      },
    });
  },

  onCloseCreateModal() {
    this.setData({ showCreateModal: false });
  },

  stopEventModalBubble() {},

  onCreateFormInput(e: any) {
    const field = e.currentTarget.dataset.field;
    if (!field) return;
    this.setData({ [`createForm.${field}`]: e.detail.value });
  },

  onCreateDateChange(e: any) {
    this.setData({ 'createForm.startDate': e.detail.value });
  },

  onCreateTimeChange(e: any) {
    this.setData({ 'createForm.startTime': e.detail.value });
  },

  async onSubmitCreateEvent() {
    const { title, location, startDate, startTime, url, desc } = this.data.createForm;
    if (!String(title || '').trim()) {
      wx.showToast({ title: '请填写活动标题', icon: 'none' });
      return;
    }
    if (!String(location || '').trim()) {
      wx.showToast({ title: '请填写活动地点或会议号', icon: 'none' });
      return;
    }
    this.setData({ creatingEvent: true });
    try {
      const start_time = `${startDate || '2026-11-01'} ${startTime || '14:00'}:00`;
      const res = await createCommunityEvent({
        title: String(title).trim(),
        location: String(location).trim(),
        start_time,
        url: String(url || '').trim(),
        desc: String(desc || '').trim(),
      });
      if (res && res.code === '200') {
        wx.showToast({ title: '同城活动已发起 🎉', icon: 'success' });
        this.setData({ showCreateModal: false });
        this.loadEvents();
      } else {
        wx.showToast({ title: res?.message || '创建失败', icon: 'none' });
      }
    } catch (err: any) {
      wx.showToast({ title: err?.message || '发起失败，请稍后重试', icon: 'none' });
    } finally {
      this.setData({ creatingEvent: false });
    }
  },
});
