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
    // 101-edit-paper.md & 103-all-ques.md: 题库检索与组卷发布
    showAssemblePaperModal: false,
    savingPaper: false,
    paperTitle: '',
    quesSearchKeyword: '',
    questionBankList: [] as any[],
    selectedQuesIds: [] as number[],
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
    this.setData({
      showAddQuesModal: false,
      showAssemblePaperModal: false,
    });
  },

  // ── 101-edit-paper.md & 103-all-ques.md: 题库检索与组卷发布 ──
  async onOpenAssemblePaperModal() {
    this.setData({
      showAssemblePaperModal: true,
      paperTitle: '',
      quesSearchKeyword: '',
      selectedQuesIds: [],
    });
    await this.loadQuestionBank();
  },

  async loadQuestionBank(keyword = '') {
    try {
      let list: any[] = [];
      if (String(keyword || '').trim()) {
        const res: any = await base.post('/api/ques/searchques', {
          search_data: JSON.stringify([['ques_title', String(keyword).trim()]]),
        });
        list = Array.isArray(res) ? res : [];
      } else {
        const res: any = await base.get('/api/ques/showques');
        list = Array.isArray(res) ? res : [];
      }
      const selectedSet = new Set(this.data.selectedQuesIds || []);
      const decorated = list.slice(0, 30).map((q: any) => ({
        ...q,
        _selected: selectedSet.has(Number(q.quesid)),
      }));
      this.setData({ questionBankList: decorated });
    } catch {
      this.setData({ questionBankList: [] });
    }
  },

  onPaperTitleInput(e: any) {
    this.setData({ paperTitle: e.detail.value || '' });
  },

  onQuesSearchInput(e: any) {
    const kw = e.detail.value || '';
    this.setData({ quesSearchKeyword: kw });
    this.loadQuestionBank(kw);
  },

  onToggleSelectQues(e: any) {
    const qid = Number(e.currentTarget.dataset.id);
    if (!qid) return;
    const cur = [...(this.data.selectedQuesIds || [])];
    const idx = cur.indexOf(qid);
    if (idx >= 0) {
      cur.splice(idx, 1);
    } else {
      cur.push(qid);
    }
    const selectedSet = new Set(cur);
    const updatedBank = (this.data.questionBankList || []).map((q: any) => ({
      ...q,
      _selected: selectedSet.has(Number(q.quesid)),
    }));
    this.setData({
      selectedQuesIds: cur,
      questionBankList: updatedBank,
    });
  },

  async onSubmitAssemblePaper() {
    if (this.data.savingPaper) return;
    const title = String(this.data.paperTitle || '').trim();
    const selectedIds = this.data.selectedQuesIds || [];
    if (!title) {
      wx.showToast({ title: '请输入新试卷名称', icon: 'none' });
      return;
    }
    if (selectedIds.length === 0) {
      wx.showToast({ title: '请至少勾选 1 道题目组卷', icon: 'none' });
      return;
    }
    this.setData({ savingPaper: true });
    try {
      const uid = Number(wx.getStorageSync('userId') || 1);
      const eachScore = Math.max(5, Math.floor(100 / selectedIds.length));
      const paperData = selectedIds.map((qid: number, idx: number) => ({
        quesid: Number(qid),
        ques_num: idx,
        ques_value: eachScore,
        ques_part: '必答题',
      }));
      await base.post('/api/ques/savepaper', {
        paper_id: 0,
        paper_title: title,
        author_id: uid,
        ques_num: paperData.length,
        score_sum: eachScore * paperData.length,
        public: 1,
        deleted_data: JSON.stringify([]),
        paper_data: JSON.stringify(paperData),
      });
      wx.showToast({ title: '📑 试卷组卷发布成功！', icon: 'success' });
      this.setData({ showAssemblePaperModal: false });
      this.fetchPapers();
    } catch {
      wx.showToast({ title: '组卷失败，请稍后重试', icon: 'none' });
    } finally {
      this.setData({ savingPaper: false });
    }
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
    const fallbackPapers = [
      {
        testpaperid: 1,
        testpaper_title: 'Python 核心语法与自动化基础闯关卷',
        testpaper_author: '青桐塾主',
        ques_num: 10,
        score_sum: 100,
        _seqBadge: '01',
      },
      {
        testpaperid: 2,
        testpaper_title: 'FastAPI 异步架构与 RESTful 接口设计测评',
        testpaper_author: '林深塾师',
        ques_num: 10,
        score_sum: 100,
        _seqBadge: '02',
      },
      {
        testpaperid: 3,
        testpaper_title: 'AI 大模型 Prompt 工程与 RAG 实战测试',
        testpaper_author: '青桐塾主',
        ques_num: 10,
        score_sum: 100,
        _seqBadge: '03',
      },
    ];
    wx.request({
      url: getBaseUrl() + '/api/ques/showtest',
      method: 'GET',
      success: (res: any) => {
        const raw = Array.isArray(res.data) && res.data.length > 0 ? res.data : fallbackPapers;
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
        const filteredPapers = this.filterList(fallbackPapers, this.data.searchKeyword);
        this.setData({
          papers: fallbackPapers,
          filteredPapers,
          loading: false,
        });
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
