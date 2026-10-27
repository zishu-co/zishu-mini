// pages/exam/index.ts
// 试卷列表页 — 展示所有已发布试卷，点击进入答题

import { getBaseUrl } from '../../services/base';

Page({
  data: {
    papers: [] as any[],
    filteredPapers: [] as any[],
    searchKeyword: '',
    categoryFilter: 'all', // 'all' | 'core' | 'mentor'
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

  filterList(papers: any[], keyword: string, category = this.data.categoryFilter) {
    let list = papers || [];
    if (category === 'core') {
      list = list.filter((item: any, idx: number) => idx < 5 || String(item.testpaper_title || '').includes('核心'));
    } else if (category === 'mentor') {
      list = list.filter((item: any) => Boolean(item.testpaper_author));
    }
    const kw = (keyword || '').trim().toLowerCase();
    if (!kw) return list;
    return list.filter((item: any) => {
      const title = String(item.testpaper_title || '').toLowerCase();
      const author = String(item.testpaper_author || '').toLowerCase();
      return title.includes(kw) || author.includes(kw);
    });
  },

  onCategoryChange(e: any) {
    const categoryFilter = e.currentTarget.dataset.cat || 'all';
    const filteredPapers = this.filterList(this.data.papers, this.data.searchKeyword, categoryFilter);
    this.setData({ categoryFilter, filteredPapers });
  },

  onSearchInput(e: any) {
    const searchKeyword = e.detail.value || '';
    const filteredPapers = this.filterList(this.data.papers, searchKeyword, this.data.categoryFilter);
    this.setData({ searchKeyword, filteredPapers });
  },

  onClearSearch() {
    const filteredPapers = this.filterList(this.data.papers, '', this.data.categoryFilter);
    this.setData({
      searchKeyword: '',
      filteredPapers,
    });
  },

  onGoReports() {
    wx.navigateTo({ url: '/pages/report/index' });
  },

  onRandomPaper() {
    const list = this.data.filteredPapers.length ? this.data.filteredPapers : this.data.papers;
    if (!list.length) {
      wx.showToast({ title: '暂无可挑战试卷', icon: 'none' });
      return;
    }
    const picked = list[Math.floor(Math.random() * list.length)];
    if (picked?.testpaperid) {
      wx.navigateTo({
        url: '/pages/test/test?testid=' + picked.testpaperid + '&id=' + picked.testpaperid,
      });
    }
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
