// pages/exam/index.ts
// 试卷列表页 — 展示所有已发布试卷，点击进入答题

Page({
  data: {
    papers: [] as any[],
    loading: true,
  },

  onLoad() {},

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().init();
    }
    this.fetchPapers();
  },

  onPullDownRefresh() {
    this.fetchPapers();
    setTimeout(() => wx.stopPullDownRefresh(), 500);
  },

  fetchPapers() {
    this.setData({ loading: true });
    wx.request({
      url: 'https://zishu.co/api/ques/showtest',
      method: 'GET',
      success: (res: any) => {
        // showtest 返回数组，admin/审核者可见全部试卷
        // 普通用户用 fetchpapers（需要筛选 reviewed=5）
        this.setData({
          papers: res.data || [],
          loading: false,
        });
      },
      fail: () => {
        this.setData({ loading: false });
      },
    });
  },

  onGoTest(e: any) {
    const testid = e.currentTarget.dataset.testid;
    wx.navigateTo({
      url: '/pages/test/test?testid=' + testid,
    });
  },
});
