// pages/exam/index.ts
// 试卷列表页 — 展示所有已发布试卷，点击进入答题

import { getBaseUrl } from '../../services/base';

Page({
  data: {
    papers: [] as any[],
    filteredPapers: [] as any[],
    searchKeyword: '',
    loading: true,
    skeletonList: [1, 2, 3, 4],
  },

  onLoad() {},

  onShow() {
    this.fetchPapers();
  },

  onPullDownRefresh() {
    this.fetchPapers();
    setTimeout(() => wx.stopPullDownRefresh(), 500);
  },

  onShareAppMessage() {
    return {
      title: `⚡ 自塾闯关题库大厅 · 精选 ${this.data.papers.length || ''} 套真题试卷等你来挑战！`,
      path: '/pages/exam/index',
    };
  },

  loadPapers() {
    this.fetchPapers();
  },

  filterList(papers: any[], keyword: string) {
    const kw = (keyword || '').trim().toLowerCase();
    if (!kw) return papers;
    return papers.filter((item: any) => {
      const title = String(item.testpaper_title || '').toLowerCase();
      const author = String(item.testpaper_author || '').toLowerCase();
      return title.includes(kw) || author.includes(kw);
    });
  },

  onSearchInput(e: any) {
    const searchKeyword = e.detail.value || '';
    const filteredPapers = this.filterList(this.data.papers, searchKeyword);
    this.setData({ searchKeyword, filteredPapers });
  },

  onClearSearch() {
    this.setData({
      searchKeyword: '',
      filteredPapers: this.data.papers,
    });
  },

  fetchPapers() {
    this.setData({ loading: true });
    wx.request({
      url: getBaseUrl() + '/api/ques/showtest',
      method: 'GET',
      success: (res: any) => {
        const raw = Array.isArray(res.data) ? res.data : [];
        const papers = raw.map((item: any, idx: number) => {
          const num = idx + 1;
          return {
            ...item,
            _seqBadge: num < 10 ? `0${num}` : `${num}`,
          };
        });
        const filteredPapers = this.filterList(papers, this.data.searchKeyword);
        this.setData({
          papers,
          filteredPapers,
          loading: false,
        });
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({ title: '加载试卷失败', icon: 'none' });
      },
    });
  },

  onGoTest(e: any) {
    const testid = e.currentTarget.dataset.testid;
    if (!testid) return;
    wx.navigateTo({
      url: '/pages/test/test?testid=' + testid + '&id=' + testid,
    });
  },
});
