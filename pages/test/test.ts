// pages/test/test.ts
interface QuestionItem {
  ques_type: string;
  ques_title: string;
  answer: string;
  reply?: string;
  check?: boolean;
  submitted?: boolean;
  item_a?: string;
  item_b?: string;
  item_c?: string;
  item_d?: string;
}

interface ITestData {
  papertitle: string;
  perform: number;
  showrst: boolean;
  checkData: QuestionItem[];
  daan: any[];
  reply: any[];
}

Page<IData, ITestData>({
  data: {
    papertitle: '教资语法',
    perform: 0,
    showrst: false,
    checkData: [] as QuestionItem[],
    daan: [],
    reply: []
  },

  onShareAppMessage() {
    return {
      title: this.data.papertitle
    }
  },

  onLoad(options: any) {
    const paperid = options.pid;
    console.log(paperid);
    const that = this;
    wx.request({
      url: 'https://zishu.co/api/ques/fetchqueses/',
      data: {
        pid: paperid,
      },
      method: 'POST',
      dataType: 'json',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'chartset': 'utf-8'
      },
      success(res: any) {
        that.setData({
          papertitle: res.data.testpaper_title,
          checkData: JSON.parse(res.data.answers)
        });
        for (let i = 0; i < that.data.checkData.length; i++) {
          if (that.data.checkData[i].ques_type === '填空题') {
            that.data.checkData[i].reply = ['', '', '', ''];
          } else {
            that.data.checkData[i].reply = '';
          }
          that.data.checkData[i].check = false;
          that.data.checkData[i].submitted = false;
        }
        that.setData({ checkData: that.data.checkData });
      },
      fail(err: any) {
        console.log('失败啦！');
        console.log(err);
      }
    });
  },

  checkClick(event: any) {
    const ind = event.target.id.split('-')[0];
    this.data.checkData[ind].reply = event.detail.value.slice().sort().join('');
    if (this.data.checkData[ind].reply === this.data.checkData[ind].answer) {
      this.data.checkData[ind].check = true;
    } else {
      this.data.checkData[ind].check = false;
    }
    this.setData({
      checkData: this.data.checkData,
    });
  },

  checkRadio(event: any) {
    const ind = event.target.id.split('-')[0];
    this.data.checkData[ind].reply = event.detail.value;
    if (this.data.checkData[ind].reply === this.data.checkData[ind].answer) {
      this.data.checkData[ind].check = true;
    } else {
      this.data.checkData[ind].check = false;
    }
    this.setData({
      checkData: this.data.checkData,
    });
  },

  checkSlot(event: any) {
    const ind = event.target.id.split('-')[0];
    const slot = event.target.id.split('-')[1];
    if (slot === 'A') {
      this.data.checkData[ind].reply![0] = event.detail.value;
    } else if (slot === 'B') {
      this.data.checkData[ind].reply![1] = event.detail.value;
    } else if (slot === 'C') {
      this.data.checkData[ind].reply![2] = event.detail.value;
    } else if (slot === 'D') {
      this.data.checkData[ind].reply![3] = event.detail.value;
    }
    const realreply: string[] = [];
    for (let i = 0; i < 4; i++) {
      if (this.data.checkData[ind].reply![i]) {
        realreply.push(this.data.checkData[ind].reply![i]);
      }
    }
    const finalreply = realreply.join(',');
    if (finalreply === this.data.checkData[ind].answer) {
      this.data.checkData[ind].check = true;
    } else {
      this.data.checkData[ind].check = false;
    }
    this.setData({
      checkData: this.data.checkData,
    });
  },

  onSubmit() {
    let score = 0;
    for (let i = 0; i < this.data.checkData.length; i++) {
      if (this.data.checkData[i].check === true) {
        score += 1;
      }
      this.data.checkData[i].submitted = true;
    }
    const perform = Math.ceil(score * 100 / this.data.checkData.length);
    const showrst = true;
    this.setData({
      checkData: this.data.checkData,
      perform,
      showrst,
    });
  }
});

interface IData {
  papertitle: string;
  perform: number;
  showrst: boolean;
  checkData: QuestionItem[];
  daan: any[];
  reply: any[];
}
