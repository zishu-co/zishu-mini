// @ts-nocheck

// pages/report/index.ts
// 成绩单页：展示用户的考试历史成绩
const _appReport = getApp();
import { getBaseUrl } from '../../services/base';

interface IReportData {
  records: any[];
  filteredRecords: any[];
  activeFilter: string;
  searchKeyword: string;
  avgScore: string;
  passRate: number;
  loading: boolean;
}

Page<IReportPageData, any>({
  data: {
    records: [],
    filteredRecords: [],
    activeFilter: 'all',
    searchKeyword: '',
    avgScore: '0',
    passRate: 0,
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

  onShareAppMessage() {
    return {
      title: `📊 我在自塾已完成 ${this.data.records.length} 场闯关测评，平均得分 ${this.data.avgScore}！`,
      path: '/pages/exam/index',
    };
  },

  decorateRecord(item: any) {
    const score = Number(item.test_score || 0);
    const full = Number(item.full_score || 0);
    const ratio = full > 0 ? score / full : 0;
    const _percent = Math.min(100, Math.max(0, Math.round(ratio * 100)));
    let _gradeBadge = '💪 待重刷';
    let _gradeClass = 'grade-fail';
    if (ratio >= 0.9) {
      _gradeBadge = '🏆 学霸 S';
      _gradeClass = 'grade-s';
    } else if (ratio >= 0.8) {
      _gradeBadge = '✨ 优秀 A';
      _gradeClass = 'grade-a';
    } else if (ratio >= 0.6) {
      _gradeBadge = '✅ 及格 B';
      _gradeClass = 'grade-b';
    }
    return {
      ...item,
      _percent,
      _ratio: ratio,
      _gradeBadge,
      _gradeClass,
      _scoreClass: this.getScoreClass(score, full),
    };
  },

  applyFilter(records: any[], filter: string, keyword = this.data.searchKeyword) {
    let list = records || [];
    if (filter === 'excellent') {
      list = list.filter((r: any) => r._ratio >= 0.8);
    } else if (filter === 'pass') {
      list = list.filter((r: any) => r._ratio >= 0.6);
    } else if (filter === 'fail') {
      list = list.filter((r: any) => r._ratio < 0.6);
    }
    const kw = (keyword || '').trim().toLowerCase();
    if (!kw) return list;
    return list.filter((r: any) => String(r.testpaper_title || '').toLowerCase().indexOf(kw) !== -1);
  },

  switchFilter(e: any) {
    const filter = e.currentTarget.dataset.filter || 'all';
    const filteredRecords = this.applyFilter(this.data.records, filter, this.data.searchKeyword);
    this.setData({
      activeFilter: filter,
      filteredRecords,
    });
  },

  onSearchInput(e: any) {
    const searchKeyword = e.detail.value || '';
    const filteredRecords = this.applyFilter(this.data.records, this.data.activeFilter, searchKeyword);
    this.setData({ searchKeyword, filteredRecords });
  },

  clearSearch() {
    const filteredRecords = this.applyFilter(this.data.records, this.data.activeFilter, '');
    this.setData({ searchKeyword: '', filteredRecords });
  },

  onRetakePaper(e: any) {
    const paperid = e.currentTarget.dataset.paperid;
    if (!paperid) {
      this.goToExam();
      return;
    }
    wx.navigateTo({
      url: `/pages/test/test?testid=${paperid}&id=${paperid}`,
    });
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

    if (!token || !userId) {
      this.setData({
        loading: false,
        records: [],
        filteredRecords: [],
        avgScore: '0',
        passRate: 0,
      });
      wx.showToast({ title: '请先登录', icon: 'none' });
      if (done) done();
      return;
    }

    wx.request({
      url: getBaseUrl() + '/api/ques/fetchtrans/by_id/' + userId,
      method: 'GET',
      header: { Authorization: 'Bearer ' + token, token },
      success: (res: any) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          const records = res.data.map((item: any) => this.decorateRecord(item));
          const totalCount = records.length;
          const sumScore = records.reduce(
            (acc: number, item: any) => acc + Number(item.test_score || 0),
            0
          );
          const passCount = records.filter((item: any) => item._ratio >= 0.6).length;
          const avgScore = totalCount > 0 ? (sumScore / totalCount).toFixed(1) : '0';
          const passRate = totalCount > 0 ? Math.round((passCount * 100) / totalCount) : 0;
          const filteredRecords = this.applyFilter(records, this.data.activeFilter);
          this.setData({
            records,
            filteredRecords,
            avgScore,
            passRate,
            loading: false,
          });
        } else {
          this.setData({
            loading: false,
            records: [],
            filteredRecords: [],
            avgScore: '0',
            passRate: 0,
          });
        }
      },
      fail: () => {
        this.setData({
          loading: false,
          records: [],
          filteredRecords: [],
          avgScore: '0',
          passRate: 0,
        });
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

  goToExam() {
    wx.navigateTo({
      url: '/pages/exam/index',
      fail: () => {
        wx.switchTab({ url: '/pages/exam/index' });
      },
    });
  },
});

interface IReportPageData {
  records: any[];
  filteredRecords: any[];
  activeFilter: string;
  avgScore: string;
  passRate: number;
  loading: boolean;
}
