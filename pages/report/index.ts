// @ts-nocheck

// pages/report/index.ts
// 成绩单页：展示用户的考试历史成绩
const _appReport = getApp();
import { getBaseUrl } from '../../services/base';

interface IReportData {
  records: any[];
  loading: boolean;
}

Page<IReportPageData, any>({
  data: {
    records: [],
    loading: true,
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '学习汇报' });
  },

  onShow() {
    this.fetchRecords();
  },

  onPullDownRefresh() {
    this.fetchRecords(() => wx.stopPullDownRefresh());
  },

  fetchRecords(done?: () => void) {
    this.setData({ loading: true });
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    const userInfo = wx.getStorageSync('userInfo') || _appReport?.globalData?.userInfo || {};
    const userId =
      wx.getStorageSync('userId') ||
      userInfo.userId ||
      userInfo.id ||
      _appReport?.globalData?.userId ||
      _appReport?.globalData?.userInfo?.userId ||
      '';
    console.log('[report] userId:', userId, 'userInfo:', userInfo, 'token:', token);

    if (!token || !userId) {
      this.setData({ loading: false, records: [] });
      console.warn('[report] token或userId为空，无法请求');
      wx.showToast({ title: '请先登录', icon: 'none' });
      if (done) done();
      return;
    }

    wx.request({
      url: getBaseUrl() + '/api/ques/fetchtrans/by_id/' + userId,
      method: 'GET',
      header: { Authorization: 'Bearer ' + token, token },
      success: (res: any) => {
        console.log('[report] fetchtrans响应:', res.statusCode, res.data);
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          const records = res.data.map((item: any) => ({
            ...item,
            _scoreClass: this.getScoreClass(
              Number(item.test_score || 0),
              Number(item.full_score || 0)
            ),
          }));
          this.setData({ records, loading: false });
        } else {
          this.setData({ loading: false, records: [] });
        }
      },
      fail: () => {
        this.setData({ loading: false, records: [] });
        wx.showToast({ title: '网络请求失败', icon: 'none' });
      },
      complete: () => {
        if (done) done();
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
