// @ts-nocheck
// pages/event/participants/index.ts
// 活动参与者列表页（普通用户视角，可看不可改）
// spec: specs/port/archive/007-port-event-participants.md
import {
  getEvent,
  fetchParticipants,
  selfSignInEvent,
  EventItem,
  ParticipantItem,
} from '../../../services/event/event';
import { quickGreetPeer } from '../../../services/user/user';

type DecoratedParticipant = ParticipantItem & {
  _avatarInitial: string;
  _levelTag: string;
  _cityTag: string;
  _joinTimeStr: string;
  _signInTimeStr: string;
  _greeted: boolean;
};

interface IParticipantsPageData {
  eventId: number;
  eventInfo: (EventItem & { _startDateStr?: string }) | null;
  participants: DecoratedParticipant[];
  filteredParticipants: DecoratedParticipant[];
  signedInCount: number;
  searchKeyword: string;
  loading: boolean;
}

Page<IParticipantsPageData, any>({
  data: {
    eventId: 0,
    eventInfo: null,
    participants: [],
    filteredParticipants: [],
    signedInCount: 0,
    searchKeyword: '',
    loading: true,
  },

  onLoad(options: any) {
    const id = Number(options?.id || 1) || 1;
    this.setData({ eventId: id });
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },

  onShareAppMessage() {
    const title = this.data.eventInfo?.title || '自塾同城共学活动';
    return {
      title: `🎉 已有 ${this.data.participants.length} 位学友报名「${title}」，一起来参加吧！`,
      path: `/pages/event/participants/index?id=${this.data.eventId}`,
    };
  },

  decorateParticipant(p: any, idx: number, defaultCity: string): DecoratedParticipant {
    const name = String(p?.username || '塾').trim();
    const _avatarInitial = name ? name.substring(0, 1).toUpperCase() : '塾';
    const badges = ['🌱 启航塾员', '⚡ 共学先锋', '🔥 实战达人', '👑 领航学长'];
    const _levelTag = p?.is_signed_in ? '🔥 现场打卡' : badges[idx % badges.length];
    const _cityTag = String(p?.city || defaultCity || '');
    const _joinTimeStr = p?.join_time ? String(p.join_time).substring(0, 16).replace('T', ' ') : '刚刚';
    const _signInTimeStr = p?.sign_in_time ? String(p.sign_in_time).substring(0, 16).replace('T', ' ') : '';
    return {
      ...p,
      _avatarInitial,
      _levelTag,
      _cityTag,
      _joinTimeStr,
      _signInTimeStr,
      _greeted: false,
    };
  },

  /** 并行加载活动详情 + 参与者列表 */
  async loadData() {
    this.setData({ loading: true });
    try {
      const [event, participants] = await Promise.all([
        getEvent(this.data.eventId).catch((e) => {
          console.error('getEvent failed', e);
          wx.showToast({ title: '活动不存在', icon: 'none' });
          setTimeout(() => wx.navigateBack(), 1000);
          return null;
        }),
        fetchParticipants(this.data.eventId).catch(() => []),
      ]);
      const defaultCity = event?.location ? String(event.location).substring(0, 6) : '';
      const rawList = Array.isArray(participants) ? participants : [];
      const decoratedList = rawList.map((p, idx) => this.decorateParticipant(p, idx, defaultCity));
      const signedInCount = decoratedList.filter((p) => p.is_signed_in).length;
      const decoratedEvent = event
        ? {
            ...event,
            _startDateStr: event.start_time ? String(event.start_time).substring(0, 16).replace('T', ' ') : '',
          }
        : null;
      this.setData({
        eventInfo: decoratedEvent,
        participants: decoratedList,
        signedInCount,
        loading: false,
      });
      this.applySearch(this.data.searchKeyword, decoratedList);
    } catch (e) {
      console.error('loadData failed', e);
      this.setData({ loading: false });
    }
  },

  onSearchInput(e: any) {
    const kw = (e?.detail?.value ?? '').trim();
    this.applySearch(kw);
  },

  onClearSearch() {
    this.applySearch('');
  },

  applySearch(keyword: string, sourceList = this.data.participants) {
    const kw = (keyword || '').toLowerCase();
    const filteredParticipants = (sourceList || []).filter((p) => {
      if (!kw) return true;
      const name = String(p.username || '').toLowerCase();
      const city = String(p._cityTag || '').toLowerCase();
      return name.includes(kw) || city.includes(kw);
    });
    this.setData({
      searchKeyword: keyword,
      filteredParticipants,
    });
  },

  async onGreetParticipant(e: any) {
    const id = e.currentTarget.dataset.id;
    const userId = Number(e.currentTarget.dataset.userid || id || 0);
    const name = e.currentTarget.dataset.name || '这位塾员';
    const eventTitle = this.data.eventInfo?.title || '自塾共学活动';
    const updated = (this.data.participants || []).map((p) =>
      p.id === id ? { ...p, _greeted: true } : p
    );
    this.setData({ participants: updated });
    this.applySearch(this.data.searchKeyword, updated);
    if (userId) {
      try {
        await quickGreetPeer({
          target_user_id: userId,
          topic: `🎉 共学活动《${eventTitle}》学习交流`,
          planed_duration: 15,
        });
      } catch (err) {
        // ignore network fallback
      }
    }
    wx.showToast({
      title: `已向 ${name} 发起学习交流邀请 👋`,
      icon: 'none',
    });
  },

  onViewParticipantSheet(e: any) {
    const userId = Number(e.currentTarget.dataset.userid || 0);
    if (userId) {
      wx.navigateTo({ url: `/pages/learn-sheet/index?userId=${userId}` });
    } else {
      wx.navigateTo({ url: '/pages/learn-sheet/index' });
    }
  },

  async onSelfSignIn() {
    if (!this.data.eventId) return;
    try {
      const res = await selfSignInEvent({ event_id: this.data.eventId });
      if (res && res.code === '200') {
        wx.showToast({ title: '现场签到成功 🎉', icon: 'success' });
        this.loadData();
      } else {
        wx.showToast({ title: res?.message || '签到失败', icon: 'none' });
      }
    } catch (err: any) {
      wx.showToast({ title: '请先报名该活动后再签到', icon: 'none' });
    }
  },

  /** 海报点击 → 跳 webview */
  onPosterTap() {
    const url = this.data.eventInfo?.url;
    if (!url) {
      wx.showToast({ title: '暂无宣传链接', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/event/webview/index?url=${encodeURIComponent(url)}`,
    });
  },

  /** 查看宣传文案 */
  onOpenPromo() {
    const url = this.data.eventInfo?.url;
    if (!url) {
      wx.showToast({ title: '暂无宣传链接', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/event/webview/index?url=${encodeURIComponent(url)}`,
    });
  },

  /** 返回活动列表 */
  onGoBack() {
    wx.navigateBack();
  },
});
