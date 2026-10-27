// @ts-nocheck

// pages/test/test.ts
// 答题页：调用 begintest 获取题目（含 quizitemid），答题后通过 checkreply 提交存库

const _appTest = getApp();
import { getBaseUrl } from '../../services/base';

interface QuestionItem {
  quizitemid?: number;
  quesid?: number;
  ques_value?: number;
  ques_type: string;
  _badgeText?: string;
  _selA?: boolean;
  _selB?: boolean;
  _selC?: boolean;
  _selD?: boolean;
  _selTrue?: boolean;
  _selFalse?: boolean;
  _isAnswered?: boolean;
  ques_title: string;
  answer: string;
  explain?: string;
  reply?: string | string[];
  check?: boolean;
  submitted?: boolean;
  item_a?: string;
  item_b?: string;
  item_c?: string;
  item_d?: string;
  descpic_url?: string;
}

interface ITestData {
  papertitle: string;
  paperauthor: string;
  perform: number;
  correctCount: number;
  answeredCount: number;
  progressPercent: number;
  rankBadge: string;
  showrst: boolean;
  submitted: boolean;
  submitting: boolean;
  filterWrongOnly: boolean;
  checkData: QuestionItem[];
  quizitemids: number[];
  paperid: number;
  paperFullScore: number;
  startTime: number;
  loading: boolean;
}

Page<ITestPageData, ITestData>({
  data: {
    papertitle: '',
    paperauthor: '',
    perform: 0,
    correctCount: 0,
    answeredCount: 0,
    progressPercent: 0,
    rankBadge: '',
    showrst: false,
    submitted: false,
    submitting: false,
    filterWrongOnly: false,
    checkData: [],
    quizitemids: [],
    paperid: 0,
    paperFullScore: 0,
    startTime: Date.now(),
    loading: true,
  },

  onShareAppMessage() {
    return { title: this.data.papertitle };
  },

  onLoad(options: any) {
    const testid = options.testid || options.id;
    if (!testid) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      return;
    }
    this.fetchQuestions(testid);
  },

  fetchQuestions(testid: string) {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    wx.showLoading({ title: '加载题目...', mask: true });
    wx.request({
      url: getBaseUrl() + '/api/ques/begintest/' + testid,
      method: 'GET',
      header: { token },
      success: (res: any) => {
        wx.hideLoading();
        const qdata: QuestionItem[] = res.data?.qdata || [];
        const paper = res.data?.paper;

        // 从 paper.answers 解析正确答案和解析
        let answerMap: Record<number, { answer: string; explain: string }> = {};
        if (paper?.answers) {
          try {
            const answers = JSON.parse(paper.answers);
            for (const a of answers) {
              answerMap[a.quesid] = { answer: a.answer, explain: a.explain || '' };
            }
          } catch (e) {
            console.error('解析答案失败', e);
          }
        }

        for (const q of qdata) {
          // 补充正确答案和解析
          if (answerMap[q.quesid]) {
            q.answer = answerMap[q.quesid].answer;
            q.explain = answerMap[q.quesid].explain;
          }

          if (q.ques_type === '选择题') {
            q._badgeText = (q.answer && q.answer.length > 1) ? '多选题' : '单选题';
          } else {
            q._badgeText = q.ques_type || '单选题';
          }

          if (q.ques_type === '填空题') {
            q.reply = ['', '', '', ''];
          } else {
            q.reply = '';
          }
          q._selA = false;
          q._selB = false;
          q._selC = false;
          q._selD = false;
          q._selTrue = false;
          q._selFalse = false;
          q._isAnswered = false;
          q.check = false;
          q.submitted = false;
        }

        this.setData({
          papertitle: paper?.testpaper_title || '在线答题',
          paperauthor: paper?.testpaper_authorname || '',
          checkData: qdata,
          quizitemids: qdata.map((q: QuestionItem) => q.quizitemid as number),
          paperid: parseInt(testid, 10),
          paperFullScore: paper?.full_score || qdata.length * 5,
          startTime: Date.now(),
          answeredCount: 0,
          progressPercent: 0,
          correctCount: 0,
          rankBadge: '',
          submitted: false,
          filterWrongOnly: false,
          showrst: false,
          loading: false,
        });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '加载失败', icon: 'none' });
        this.setData({ loading: false });
      },
    });
  },

  updateAnsweredState() {
    const list = this.data.checkData || [];
    let answeredCount = 0;
    for (const q of list) {
      let hasAns = false;
      if (Array.isArray(q.reply)) {
        hasAns = q.reply.some((s) => Boolean(s && String(s).trim()));
      } else if (q.reply && String(q.reply).trim()) {
        hasAns = true;
      }
      q._isAnswered = hasAns;
      if (hasAns) answeredCount += 1;
    }
    const progressPercent = list.length > 0 ? Math.round((answeredCount * 100) / list.length) : 0;
    this.setData({
      checkData: list,
      answeredCount,
      progressPercent,
    });
  },

  onToggleWrongOnly(e: any) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ filterWrongOnly: mode === 'wrong' });
  },

  checkClick(event: any) {
    if (this.data.submitted) return;
    const idStr = event.currentTarget?.id || event.target?.id || '';
    const ind = parseInt(idStr.split('-')[0], 10);
    const q = this.data.checkData[ind];
    if (!q) return;
    const vals = (event.detail.value as string[]).slice().sort();
    q.reply = vals.join('');
    q._selA = vals.includes('A');
    q._selB = vals.includes('B');
    q._selC = vals.includes('C');
    q._selD = vals.includes('D');
    this.updateAnsweredState();
  },

  checkRadio(event: any) {
    if (this.data.submitted) return;
    const idStr = event.currentTarget?.id || event.target?.id || '';
    const ind = parseInt(idStr.split('-')[0], 10);
    const q = this.data.checkData[ind];
    if (!q) return;
    const val = event.detail.value as string;
    q.reply = val;
    q._selTrue = val === '正确';
    q._selFalse = val === '错误';
    this.updateAnsweredState();
  },

  checkSlot(event: any) {
    if (this.data.submitted) return;
    const idStr = (event.currentTarget?.id || event.target?.id || '') as string;
    const parts = idStr.split('-');
    const ind = parseInt(parts[0], 10);
    const slot = parts[1];
    const q = this.data.checkData[ind];
    if (!q) return;

    if (slot === 'A') (q.reply as string[])[0] = event.detail.value;
    else if (slot === 'B') (q.reply as string[])[1] = event.detail.value;
    else if (slot === 'C') (q.reply as string[])[2] = event.detail.value;
    else if (slot === 'D') (q.reply as string[])[3] = event.detail.value;

    this.updateAnsweredState();
  },

  evaluateQuestionCorrectness(q: QuestionItem): boolean {
    if (q.ques_type === '填空题') {
      const realreply: string[] = ((q.reply as string[]) || []).map((s) => String(s || '').trim()).filter(Boolean);
      return realreply.join(',') === String(q.answer || '').trim();
    }
    return String(q.reply || '').trim() === String(q.answer || '').trim();
  },

  onSubmit() {
    if (this.data.submitting || this.data.submitted) return;
    const { checkData } = this.data;
    let score = 0;
    for (const q of checkData) {
      q.check = this.evaluateQuestionCorrectness(q);
      if (q.check) score += 1;
      q.submitted = true;
    }
    const perform = checkData.length > 0
      ? Math.ceil(score * 100 / checkData.length)
      : 0;
    const rankBadge =
      perform === 100
        ? '🏆 满分学霸 · 传奇通关'
        : perform >= 80
        ? '⚡ 闯关达人 · 实力认证'
        : perform >= 60
        ? '🌟 稳步进阶 · 及格通关'
        : '🌱 继续加油 · 温故知新';

    this.setData({
      checkData,
      correctCount: score,
      perform,
      rankBadge,
      showrst: true,
      submitted: true,
    });
    this.submitResult(score);
  },

  onRetryQuiz() {
    if (!this.data.paperid) return;
    this.fetchQuestions(String(this.data.paperid));
  },

  onFindStudyBuddy() {
    wx.navigateTo({ url: '/pages/all/index' });
  },

  submitResult(score: number) {
    if (this.data.submitting) return;
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    const userId =
      (_appTest.globalData as any)?.userInfo?.userId ||
      (_appTest.globalData as any)?.userId ||
      wx.getStorageSync('userInfo')?.userId ||
      wx.getStorageSync('userId');
    if (!token || !userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ submitting: true, submitted: true });
    const { checkData, quizitemids, paperid, startTime } = this.data;
    const finishTime = Date.now();

    const reply_array = checkData.map((q: QuestionItem) => {
      if (q.ques_type === '选择题' || q.ques_type === '判断题') {
        return ((q.reply as string) || '').split('').sort();
      } else if (q.ques_type === '填空题') {
        return q.reply as string[];
      }
      return (q.reply as string[]) || [];
    });

    const quizitemids_array = quizitemids.map((qid: number, idx: number) => {
      const q = checkData[idx];
      return [qid, q.quesid || 0, q.ques_value || 5];
    });

    wx.request({
      url: getBaseUrl() + '/api/ques/checkreply/',
      method: 'POST',
      data: {
        message: JSON.stringify(reply_array),
        quizitemids: JSON.stringify(quizitemids_array),
        userid: userId,
        paper_id: paperid,
        start_Date: startTime.toString(),
        finish_Date: finishTime.toString(),
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'token': token,
      },
      success: (res: any) => {
        console.log('提交结果', res.data);
        wx.showToast({ title: `交卷成功！得分 ${this.data.perform} 分`, icon: 'success' });
      },
      fail: (err) => {
        console.log('提交失败', err);
        wx.showToast({ title: '成绩保存失败，请检查网络', icon: 'none' });
      },
      complete: () => {
        this.setData({ submitting: false });
      },
    });
  },
});

interface ITestPageData {
  papertitle: string;
  paperauthor: string;
  perform: number;
  showrst: boolean;
  submitted: boolean;
  submitting: boolean;
  filterWrongOnly: boolean;
  checkData: QuestionItem[];
  quizitemids: number[];
  paperid: number;
  paperFullScore: number;
  startTime: number;
  loading: boolean;
}
