// @ts-nocheck
// pages/report-detail/index.ts
// 成绩详情页：展示某次考试的答题详情
const _app = getApp();
import { getBaseUrl } from '../../services/base';

interface QuestionItem {
  quesid: number;
  ques_title: string;
  ques_type: string;
  item_a: string;
  item_b: string;
  item_c: string;
  item_d: string;
  answer: string;      // 正确答案
  explain?: string;   // 解析
  user_answer: string; // 用户答案
  is_correct: boolean; // 是否正确
  userHasA: boolean;
  userHasB: boolean;
  userHasC: boolean;
  userHasD: boolean;
  ansHasA: boolean;
  ansHasB: boolean;
  ansHasC: boolean;
  ansHasD: boolean;
}

interface IReportDetailData {
  papertitle: string;
  test_score: number;
  full_score: number;
  scorePercent: number;
  test_time?: string;
  questions: QuestionItem[];
  loading: boolean;
}

function buildQuestionItems(
  qdata: any[],
  userAnswers: string[],
  correctFlags: boolean[],
  answersList: { answer: string; explain?: string }[] = []
): QuestionItem[] {
  return (qdata || []).map((q: any, index: number) => {
    const correct = answersList[index] || {
      answer: q.answer || q.correct_answer || '',
      explain: q.explain || '',
    };
    const userAns = String(userAnswers[index] ?? q.reply ?? '');
    const ansStr = String(correct.answer || '');
    const isCorrect =
      typeof correctFlags[index] === 'boolean'
        ? correctFlags[index]
        : Boolean(ansStr && userAns === ansStr);
    return {
      quesid: index,
      ques_title: q.ques_title || '',
      ques_type: q.ques_type || '选择题',
      item_a: q.item_a || '',
      item_b: q.item_b || '',
      item_c: q.item_c || '',
      item_d: q.item_d || '',
      answer: ansStr,
      explain: correct.explain || q.explain || '',
      user_answer: userAns,
      is_correct: isCorrect,
      userHasA: userAns.indexOf('A') !== -1,
      userHasB: userAns.indexOf('B') !== -1,
      userHasC: userAns.indexOf('C') !== -1,
      userHasD: userAns.indexOf('D') !== -1,
      ansHasA: ansStr.indexOf('A') !== -1,
      ansHasB: ansStr.indexOf('B') !== -1,
      ansHasC: ansStr.indexOf('C') !== -1,
      ansHasD: ansStr.indexOf('D') !== -1,
    };
  });
}

Page<IReportDetailPageData, any>({
  data: {
    papertitle: '',
    test_score: 0,
    full_score: 0,
    scorePercent: 0,
    test_time: '',
    questions: [],
    loading: true,
  },

  onLoad(options: any) {
    const pperformid = options?.pperformid;
    const paperid = options?.paperid;
    if (!pperformid) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    wx.setNavigationBarTitle({ title: '答题报告详情' });
    this.loadReportDetail(pperformid, paperid);
  },

  loadReportDetail(pperformid: string, paperid?: string) {
    this.fetchDetail(pperformid, paperid);
  },

  fetchDetail(pperformid: string, paperid?: string) {
    this.setData({ loading: true });
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';

    // 先获取用户答题记录，从数据中获取 paperid
    wx.request({
      url: getBaseUrl() + '/api/ques/showwrong/' + pperformid,
      method: 'GET',
      header: { token },
      success: (res: any) => {
        if (!res.data || !Array.isArray(res.data.qdata)) {
          this.setData({ loading: false });
          wx.showToast({ title: '暂无详情', icon: 'none' });
          return;
        }

        const qdata = res.data.qdata;
        const correctCount = qdata.filter((q: any) => q.getscore === 1).length;
        const testScore = correctCount;
        const fullScore = qdata.length;
        const scorePercent = fullScore > 0 ? Math.ceil((testScore * 100) / fullScore) : 0;

        const userAnswers: string[] = qdata.map((q: any) => q.reply || '');
        const correctFlags: boolean[] = qdata.map((q: any) => q.getscore === 1);

        // 保存用户答案数据到页面，用于后续合并
        (this as any)._userAnswers = userAnswers;
        (this as any)._correctFlags = correctFlags;
        (this as any)._qdata = qdata;

        const resolvedPaperId = Number(paperid || res.data.ginfo?.paperid || res.data.ginfo?.testpaperid || 0);

        this.setData({
          papertitle: res.data.ginfo?.tptitle || '考试成绩详情',
          test_score: testScore,
          full_score: fullScore,
          scorePercent,
          test_time: res.data.ginfo?.test_time || '',
        });

        // 如果有有效 paperid，再获取正确答案；否则回退使用 qdata
        if (resolvedPaperId > 0) {
          this.fetchPaperAnswers(String(resolvedPaperId), token);
        } else {
          const fallbackQuestions = buildQuestionItems(qdata, userAnswers, correctFlags, []);
          this.setData({
            questions: fallbackQuestions,
            loading: false,
          });
        }
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({ title: '加载失败', icon: 'none' });
      },
    });
  },

  // 获取试卷的正确答案
  fetchPaperAnswers(paperid: string, token: string) {
    const userAnswers: string[] = (this as any)._userAnswers || [];
    const correctFlags: boolean[] = (this as any)._correctFlags || [];
    const qdata: any[] = (this as any)._qdata || [];

    wx.request({
      url: getBaseUrl() + '/api/ques/begintest/' + paperid,
      method: 'GET',
      header: { token },
      success: (res: any) => {
        const answersList: { answer: string; explain?: string }[] = [];
        try {
          if (res.data?.paper?.answers) {
            const answers = JSON.parse(res.data.paper.answers);
            for (const a of answers) {
              answersList.push({ answer: a.answer, explain: a.explain });
            }
          }
        } catch (e) {
          console.error('解析正确答案失败', e);
        }

        const questions = buildQuestionItems(qdata, userAnswers, correctFlags, answersList);
        this.setData({ questions });
      },
      fail: (err) => {
        console.error('获取正确答案失败，回退使用 qdata', err);
        const fallbackQuestions = buildQuestionItems(qdata, userAnswers, correctFlags, []);
        this.setData({ questions: fallbackQuestions });
      },
      complete: () => {
        this.setData({ loading: false });
      },
    });
  },
});

interface IReportDetailPageData {
  papertitle: string;
  test_score: number;
  full_score: number;
  scorePercent: number;
  test_time?: string;
  questions: QuestionItem[];
  loading: boolean;
}
