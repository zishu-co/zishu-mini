// @ts-nocheck
// pages/event/index.ts
// 活动列表页（普通用户视角）
// spec: specs/port/archive/006-port-event-list.md
import {
  fetchCurrentEvents,
  fetchHistoricalEvents,
  joinEvent,
  EventItem,
} from '../../services/event/event';

const app = getApp();

interface IEventPageData {
  activeTab: 'current' | 'historical';
  currentEvents: EventItem[];
  historicalEvents: EventItem[];
  loading: boolean;
  hasLogin: boolean;
}

Page<IEventPageData, IEventPageData>({
  data: {
    activeTab: 'current',
    currentEvents: [],
    historicalEvents: [],
    loading: true,
    hasLogin: false,
  },

  onShow() {
    if (typeof this.getTabBar === 'function') {
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

  /** 加载活动列表（同时拉当前 + 历史） */
  async loadEvents() {
    this.setData({ loading: true });
    try {
      const [current, historical] = await Promise.all([
        fetchCurrentEvents().catch(() => []),
        fetchHistoricalEvents().catch(() => []),
      ]);
      this.setData({
        currentEvents: Array.isArray(current) ? current : [],
        historicalEvents: Array.isArray(historical) ? historical : [],
        loading: false,
      });
    } catch (e) {
      console.error('loadEvents failed', e);
      this.setData({ loading: false });
    }
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
    if (!id) return;
    const res = await wx.showModal({
      title: '报名确认',
      content: '请先确认您已在「活动行」或「粗门」平台完成报名，再点击确认加入',
      confirmText: '确认加入',
      cancelText: '取消',
    });
    if (!res.confirm) return;
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
    }
  },
});
