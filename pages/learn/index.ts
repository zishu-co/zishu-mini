// pages/index/index.ts
const app = getApp();

type IData = {
  paperdata: any[];
  userInfo: any;
  value: string;
  list: { value: string; label: string; icon: string }[];
  hasUserInfo: boolean;
  canIUse: boolean;
  canIUseGetUserProfile: boolean;
  canIUseOpenData: boolean;
};

Page<IData, IData>({
  data: {
    paperdata: [],
    userInfo: {},
    value: 'label_1',
    list: [
      { value: 'label_1', label: '首页', icon: 'home' },
      { value: 'label_2', label: '应用', icon: 'app' },
      { value: 'label_3', label: '聊天', icon: 'chat' },
      { value: 'label_4', label: '我的', icon: 'user' },
    ],
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    canIUseGetUserProfile: false,
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName')
  },

  bindViewTap() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },

  onShareAppMessage() {
    return {
      title: '学本领 上自塾'
    }
  },

  onChange(e: any) {
    this.setData({
      value: e.detail.value,
    });
  },

  onShow() {
    this.getTabBar().init();
  },

  onLoad() {
    const that = this;
    wx.request({
      url: 'https://zishu.co/api/ques/fetchpapers/',
      data: {
        send1: 'send',
      },
      method: 'POST',
      dataType: 'json',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'chartset': 'utf-8'
      },
      success(res: any) {
        that.setData({
          paperdata: res.data
        })
      },
      fail(err: any) {
        console.log('失败啦！')
        console.log(err)
      }
    })
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
  },

  getUserProfile() {
    wx.getUserProfile({
      desc: '展示用户信息',
      success: (res) => {
        console.log(res)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },

  getUserInfo(e: any) {
    console.log(e)
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  }
});
