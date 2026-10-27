// pages/exam/index.ts
// 试卷列表页 — 展示所有已发布试卷，点击进入答题

import base, { getBaseUrl } from '../../services/base';

Page({
  data: {
    papers: [] as any[],
    filteredPapers: [] as any[],
    searchKeyword: '',
    categoryFilter: 'all', // 'all' | 'core' | 'mentor'
    loading: true,
    skeletonList: [1, 2, 3, 4],
    // 102-add-ques.md: 共创出题
    showAddQuesModal: false,
    savingQues: false,
    newQuesForm: {
      ques_type: '选择题',
      ques_title: '',
      item_a: '',
      item_b: '',
      item_c: '',
      item_d: '',
      answer: 'A',
      explain: '',
    },
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

  // ── 102-add-ques.md: 共创出题 ──────────────────────────────────
  onOpenAddQuesModal() {
    this.setData({
      showAddQuesModal: true,
      newQuesForm: {
        ques_type: '选择题',
        ques_title: '',
        item_a: '',
        item_b: '',
        item_c: '',
        item_d: '',
        answer: 'A',
        explain: '',
      },
    });
  },

  onCloseAddQuesModal() {
    this.setData({ showAddQuesModal: false });
  },

  onSelectQuesType(e: any) {
    const t = e.currentTarget.dataset.type || '选择题';
    this.setData({
      'newQuesForm.ques_type': t,
      'newQuesForm.answer': t === '判断题' ? '正确' : t === '选择题' ? 'A' : '',
    });
  },

  onQuesFormInput(e: any) {
    const field = e.currentTarget.dataset.field;
    if (!field) return;
    this.setData({
      [`newQuesForm.${field}`]: e.detail.value,
    });
  },

  async onSubmitNewQues() {
    const f = this.data.newQuesForm;
    if (!String(f.ques_title || '').trim()) {
      wx.showToast({ title: '请输入题干内容', icon: 'none' });
      return;
    }
    if (f.ques_type === '选择题' && (!f.item_a.trim() || !f.item_b.trim())) {
      wx.showToast({ title: '选择题请至少填写 A、B 选项', icon: 'none' });
      return;
    }
    if (!String(f.answer || '').trim()) {
      wx.showToast({ title: '请填写标准答案', icon: 'none' });
      return;
    }
    this.setData({ savingQues: true });
    try {
      const res: any = await base.post('/api/ques/addnewqu', {
        ques_updateid: 0,
        ques_type: f.ques_type,
        ques_title: f.ques_title.trim(),
        ques_desc: '',
        item_a: f.item_a.trim(),
        item_b: f.item_b.trim(),
        item_c: f.item_c.trim(),
        item_d: f.item_d.trim(),
        answer: f.answer.trim(),
        explain: f.explain.trim(),
      });
      if (res && res.result) {
        wx.showToast({ title: '🎉 题目已入库，感谢共创！', icon: 'success' });
        this.setData({ showAddQuesModal: false });
      } else {
        wx.showToast({ title: '提交失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '提交失败，请先登录', icon: 'none' });
    } finally {
      this.setData({ savingQues: false });
    }
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
