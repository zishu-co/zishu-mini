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
  showrst: boolean;
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
    showrst: false,
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

  onShareTimeline() {
    return { title: this.data.papertitle };
  },

  onLoad(options: any) {
    const testid = options.testid;
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

          if (q.ques_type === '填空题') {
            q.reply = ['', '', '', ''];
          } else {
            q.reply = '';
          }
          q.check = false;
          q.submitted = false;
        }

        for (const q of qdata) {
          if (q.ques_type === '填空题') {
            q.reply = ['', '', '', ''];
          } else {
            q.reply = '';
          }
          q.check = false;
          q.submitted = false;
        }

        this.setData({
          papertitle: paper?.testpaper_title || '考试',
          paperauthor: paper?.testpaper_authorname || '',
          checkData: qdata,
          quizitemids: qdata.map((q: QuestionItem) => q.quizitemid as number),
          paperid: parseInt(testid),
          paperFullScore: paper?.full_score || qdata.length * 5,
          startTime: Date.now(),
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

  checkClick(event: any) {
    const ind = parseInt(event.target.id.split('-')[0]);
    const q = this.data.checkData[ind];
    q.reply = (event.detail.value as string[]).slice().sort().join('');
    q.check = q.reply === q.answer;
    console.log('选择题 - 用户答案:', q.reply, '正确答案:', q.answer, '是否正确:', q.check);
    this.setData({ checkData: this.data.checkData });
  },

  checkRadio(event: any) {
    const ind = parseInt(event.target.id.split('-')[0]);
    const q = this.data.checkData[ind];
    q.reply = event.detail.value as string;
    q.check = q.reply === q.answer;
    console.log('判断题 - 用户答案:', q.reply, '正确答案:', q.answer, '是否正确:', q.check);
    this.setData({ checkData: this.data.checkData });
  },

  checkSlot(event: any) {
    const parts = (event.target.id as string).split('-');
    const ind = parseInt(parts[0]);
    const slot = parts[1];
    const q = this.data.checkData[ind];

    if (slot === 'A') (q.reply as string[])[0] = event.detail.value;
    else if (slot === 'B') (q.reply as string[])[1] = event.detail.value;
    else if (slot === 'C') (q.reply as string[])[2] = event.detail.value;
    else if (slot === 'D') (q.reply as string[])[3] = event.detail.value;

    const realreply: string[] = (q.reply as string[]).filter(Boolean);
    const finalreply = realreply.join(',');
    q.check = finalreply === q.answer;
    this.setData({ checkData: this.data.checkData });
  },

  onSubmit() {
    const { checkData } = this.data;
    let score = 0;
    for (const q of checkData) {
      if (q.check) score += 1;
      q.submitted = true;
    }
    const perform = checkData.length > 0
      ? Math.ceil(score * 100 / checkData.length)
      : 0;

    this.setData({ checkData, perform, showrst: true });
    this.submitResult(score);
  },

  submitResult(score: number) {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    const userId = (_appTest.globalData as any)?.userInfo?.userId;
    if (!token || !userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const { checkData, quizitemids, paperid, startTime } = this.data;
    const finishTime = Date.now();

    const reply_array = checkData.map((q: QuestionItem) => {
      if (q.ques_type === '选择题' || q.ques_type === '判断题') {
        return (q.reply as string || '').split('').sort();
      } else if (q.ques_type === '填空题') {
        return q.reply as string[];
      }
      return q.reply as string[] || [];
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
      },
      fail: (err) => {
        console.log('提交失败', err);
      },
    });
  },
});

interface ITestPageData {
  papertitle: string;
  paperauthor: string;
  perform: number;
  showrst: boolean;
  checkData: QuestionItem[];
  quizitemids: number[];
  paperid: number;
  paperFullScore: number;
  startTime: number;
  loading: boolean;
}
