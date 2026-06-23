// @ts-nocheck
// pages/event/participants/index.ts
// 活动参与者列表页（普通用户视角，可看不可改）
// spec: specs/port/archive/007-port-event-participants.md
import {
  getEvent,
  fetchParticipants,
  EventItem,
  ParticipantItem,
} from '../../../services/event/event';

interface IParticipantsPageData {
  eventId: number;
  eventInfo: EventItem | null;
  participants: ParticipantItem[];
  loading: boolean;
}

Page<IParticipantsPageData, IParticipantsPageData>({
  data: {
    eventId: 0,
    eventInfo: null,
    participants: [],
    loading: true,
  },

  onLoad(options: any) {
    const id = Number(options?.id || 0);
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
      return;
    }
    this.setData({ eventId: id });
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
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
      this.setData({
        eventInfo: event,
        participants: Array.isArray(participants) ? participants : [],
        loading: false,
      });
    } catch (e) {
      console.error('loadData failed', e);
      this.setData({ loading: false });
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
