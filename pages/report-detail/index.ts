// pages/report-detail/index.ts
// 成绩详情页：展示某次考试的答题详情
const _app = getApp();

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
}

interface IReportDetailData {
  papertitle: string;
  test_score: number;
  full_score: number;
  questions: QuestionItem[];
  loading: boolean;
}

Page<IReportDetailPageData, IReportDetailData>({
  data: {
    papertitle: '',
    test_score: 0,
    full_score: 0,
    questions: [],
    loading: true,
  },

  onLoad(options: any) {
    const pperformid = options.pperformid;
    const paperid = options.paperid;
    if (!pperformid) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    wx.setNavigationBarTitle({ title: '答题详情' });
    this.fetchDetail(pperformid, paperid);
  },

  fetchDetail(pperformid: string, paperid?: string) {
    this.setData({ loading: true });
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';

    // 先获取用户答题记录，从数据中获取 paperid
    wx.request({
      url: 'https://zishu.co/api/ques/showwrong/' + pperformid,
      method: 'GET',
      header: { token },
      success: (res: any) => {
        if (!res.data || !res.data.qdata) {
          this.setData({ loading: false });
          wx.showToast({ title: '暂无详情', icon: 'none' });
          return;
        }

        const qdata = res.data.qdata;
        // 分数应该根据每道题的得分情况计算，而不是直接用 ginfo.score
        const correctCount = qdata.filter((q: any) => q.getscore === 1).length;
        const testScore = correctCount; // 正确题目数量作为得分
        const fullScore = qdata.length;

        // 用户答案直接用数组，按顺序匹配
        // 注意：showwrong 的 qdata 没有 quesid，用数组索引匹配
        const userAnswers: string[] = qdata.map((q: any) => q.reply || '');
        const correctFlags: boolean[] = qdata.map((q: any) => q.getscore === 1);

        this.setData({
          papertitle: res.data.ginfo?.tptitle || '考试成绩详情',
          test_score: testScore,
          full_score: fullScore,
          loading: false,
        });

        // 保存用户答案数据到页面，用于后续合并
        (this as any)._userAnswers = userAnswers;
        (this as any)._correctFlags = correctFlags;
        (this as any)._qdata = qdata;

        // 如果有 paperid，再获取正确答案
        if (paperid) {
          this.fetchPaperAnswers(paperid, token);
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
    wx.request({
      url: 'https://zishu.co/api/ques/begintest/' + paperid,
      method: 'GET',
      header: { token },
      success: (res: any) => {
        const userAnswers: string[] = (this as any)._userAnswers || [];
        const correctFlags: boolean[] = (this as any)._correctFlags || [];
        const qdata: any[] = (this as any)._qdata || [];

        // 解析正确答案
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

        // 构建题目列表，用数组索引匹配
        const questions: QuestionItem[] = qdata.map((q: any, index: number) => {
          const correct = answersList[index] || { answer: '', explain: '' };
          const userAns = userAnswers[index] || '';
          const isCorrect = correctFlags[index] || (userAns === correct.answer);
          return {
            quesid: index,
            ques_title: q.ques_title || '',
            ques_type: q.ques_type || '选择题',
            item_a: q.item_a || '',
            item_b: q.item_b || '',
            item_c: q.item_c || '',
            item_d: q.item_d || '',
            answer: correct.answer || '',
            explain: correct.explain || '',
            user_answer: userAns,
            is_correct: isCorrect,
          };
        });

        this.setData({ questions });
      },
      fail: (err) => {
        console.error('获取正确答案失败', err);
      },
    });
  },
});

interface IReportDetailPageData {
  papertitle: string;
  test_score: number;
  full_score: number;
  questions: QuestionItem[];
  loading: boolean;
}
