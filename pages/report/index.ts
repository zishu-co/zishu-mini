// @ts-nocheck

// pages/report/index.ts
// 成绩单页：展示用户的考试历史成绩
const _appReport = getApp();

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
    if (typeof this.getTabBar === 'function') {
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
    const userId = (_appReport.globalData as any)?.userInfo?.userId;
    if (!token || !userId) {
      this.setData({ loading: false, records: [] });
      return;
    }
    // 成绩单接口
    wx.request({
      url: 'https://zishu.co/api/ques/fetchtrans/' + encodeURIComponent(_appReport.globalData?.userInfo?.username || ''),
      method: 'GET',
      header: { token },
      success: (res: any) => {
        this.setData({ records: res.data || [], loading: false });
      },
      fail: () => {
        this.setData({ loading: false, records: [] });
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
});

interface IReportPageData {
  records: any[];
  loading: boolean;
}
