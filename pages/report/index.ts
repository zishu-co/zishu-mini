// @ts-nocheck

// pages/report/index.ts
// 成绩单页：展示用户的考试历史成绩
const _appReport = getApp();
import { getBaseUrl } from '../../services/base';

interface IReportData {
  records: any[];
  loading: boolean;
}

Page<IReportPageData, IReportData>({
  data: {
    records: [],
    loading: true,
  },

  onLoad() {},

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().init();
    }
    this.fetchRecords();
  },

  onPullDownRefresh() {
    this.fetchRecords();
    setTimeout(() => wx.stopPullDownRefresh(), 500);
  },

  fetchRecords() {
    this.setData({ loading: true });
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    const userInfo = wx.getStorageSync('userInfo') || _appReport.globalData.userInfo || {};
    const userId = userInfo.userId || _appReport.globalData.userId || '';
    console.log('[report] userId:', userId, 'userInfo:', userInfo, 'token:', token);
    
    if (!token || !userId) {
      this.setData({ loading: false, records: [] });
      console.warn('[report] token或userId为空，无法请求');
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    
    wx.request({
      url: getBaseUrl() + '/api/ques/fetchtrans/by_id/' + userId,
      method: 'GET',
      header: { Authorization: 'Bearer ' + token },
      success: (res: any) => {
        console.log('[report] fetchtrans响应:', res.statusCode, res.data);
        if (res.statusCode === 200) {
          this.setData({ records: res.data || [], loading: false });
        } else {
          this.setData({ loading: false, records: [] });
        }
      },
      fail: () => {
        this.setData({ loading: false, records: [] });
        wx.showToast({ title: '网络请求失败', icon: 'none' });
      },
    });
  },

  getScoreClass(score: number, full: number): string {
    const pct = full > 0 ? score / full : 0;
    if (pct >= 0.9) return 'score-excellent';
    if (pct >= 0.7) return 'score-good';
    if (pct >= 0.6) return 'score-ok';
    return 'score-fail';
  },

  onViewDetail(e: any) {
    const pperformid = e.currentTarget.dataset.pperformid;
    const paperid = e.currentTarget.dataset.paperid;
    if (!pperformid) return;
    let url = '/pages/report-detail/index?pperformid=' + pperformid;
    if (paperid) {
      url += '&paperid=' + paperid;
    }
    wx.navigateTo({ url });
  },

  onShareAppMessage() {
    return { title: '自塾·考试成绩', path: '/pages/report/index' };
  },

  onShareTimeline() {
    return { title: '自塾·考试成绩' };
  },
});

interface IReportPageData {
  records: any[];
  loading: boolean;
}
