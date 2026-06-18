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
    const nickName = userInfo.nickName || '';
    // TODO: 后端改为 userId 查询后，切换为 /api/ques/fetchtrans/{userId}
    
    if (!token || !nickName) {
      this.setData({ loading: false, records: [] });
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    
    wx.request({
      url: 'https://zishu.co/api/ques/fetchtrans/' + encodeURIComponent(nickName),
      method: 'GET',
      header: { token },
      success: (res: any) => {
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
});

interface IReportPageData {
  records: any[];
  loading: boolean;
}
