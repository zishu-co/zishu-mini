// pages/my/my.ts
// Toast 使用 require 方式导入
const Toast = require('tdesign-miniprogram/toast/index').default;

interface IData {
  userInfo: {
    avatarUrl: string;
    nickName: string;
    phoneNumber: string;
  };
  currAuthStep: number;
  showMakePhone: boolean;
  customerServiceInfo: {
    servicePhone: string;
    serviceTimeDuration: string;
  };
  showKefu: boolean;
  versionNo: string;
}

Page<IData, IData>({
  data: {
    userInfo: {
      avatarUrl: '',
      nickName: '未登录',
      phoneNumber: '',
    },
    currAuthStep: 1,
    showMakePhone: false,
    customerServiceInfo: {
      servicePhone: '4006336868',
      serviceTimeDuration: '每周三至周五 9:00-12:00  13:00-15:00',
    },
    showKefu: true,
    versionNo: '',
  },

  onLoad() {
    this.getVersionInfo();
  },

  onShow() {
    this.getTabBar().init();
    this.init();
  },

  init() {
    // 从本地存储读取真实的用户信息
    const localUserInfo = wx.getStorageSync('userInfo') || {};
    const localPhoneNumber = wx.getStorageSync('phoneNumber') || '';

    const userInfo = {
      avatarUrl: localUserInfo.avatarUrl || '',
      nickName: localUserInfo.nickName || '未登录',
      phoneNumber: localPhoneNumber,
    };

    // 判断登录状态
    const isLoggedIn = localUserInfo && localUserInfo.nickName && localPhoneNumber;

    this.setData({
      userInfo,
      currAuthStep: isLoggedIn ? 2 : 1,
    });
  },

  onClickCell(e: any) {
    const { type } = e.currentTarget.dataset;

    switch (type) {
      case 'address': {
        wx.navigateTo({ url: '/pages/user/address/list/index' });
        break;
      }
      case 'service': {
        this.openMakePhone();
        break;
      }
      case 'help-center': {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '你点击了帮助中心',
          icon: '',
          duration: 1000,
        });
        break;
      }
      case 'point': {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '你点击了积分菜单',
          icon: '',
          duration: 1000,
        });
        break;
      }
      case 'coupon': {
        wx.navigateTo({ url: '/pages/coupon/coupon-list/index' });
        break;
      }
      default: {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '未知跳转',
          icon: '',
          duration: 1000,
        });
        break;
      }
    }
  },

  jumpNav(e: any) {
    let status: number;
    if (e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.status !== undefined) {
      // 来自自定义菜单的点击
      status = parseInt(e.currentTarget.dataset.status);
    } else if (e.detail && e.detail.tabType !== undefined) {
      // 来自组件的事件
      status = e.detail.tabType;
    } else {
      return;
    }

    if (status === 0) {
      wx.navigateTo({ url: '/pages/order/after-service-list/index' });
    } else {
      wx.navigateTo({ url: `/pages/order/order-list/index?status=${status}` });
    }
  },

  jumpAllOrder() {
    wx.navigateTo({ url: '/pages/order/order-list/index' });
  },

  openMakePhone() {
    this.setData({ showMakePhone: true });
  },

  closeMakePhone() {
    this.setData({ showMakePhone: false });
  },

  call() {
    wx.makePhoneCall({
      phoneNumber: this.data.customerServiceInfo.servicePhone,
    });
  },

  gotoUserEditPage() {
    // 已登录，跳转到编辑页面
    if (this.data.currAuthStep === 2) {
      wx.navigateTo({ url: '/pages/user/person-info/index' });
    } else {
      // 未登录，跳转到登录页
      wx.navigateTo({ url: '/pages/login/login' });
    }
  },

  getVersionInfo() {
    const versionInfo = wx.getAccountInfoSync();
    const version = versionInfo.miniProgram.version;
    const envVersion = (versionInfo.miniProgram as any).envVersion || __wxConfig;
    this.setData({
      versionNo: envVersion === 'release' ? version : envVersion,
    });
  },

  logOut() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储
          wx.clearStorageSync();
          // 清除全局数据
          const app = getApp<any>();
          app.globalData.userInfo = null;
          app.globalData.hasUserInfo = false;
          app.globalData.phoneNumber = '';
          app.globalData.hasPhoneNumber = false;
          app.globalData.accessToken = '';
          app.globalData.refreshToken = '';
          this.setData({
            userInfo: {
              avatarUrl: '',
              nickName: '未登录',
              phoneNumber: '',
            },
            currAuthStep: 1,
          });
          Toast({
            context: this,
            selector: '#t-toast',
            message: '已退出登录',
          });
        }
      },
    });
  },
});
