// app.ts
import { getBaseUrl } from './services/base';
interface GlobalData {
  userInfo: any;
  hasUserInfo: boolean;
  phoneNumber: string;
  hasPhoneNumber: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  userId: number | null;  // 添加 userId 字段
  openid: string | null;
  sessionkey: string | null;
  code: string | null;
}

App<IAppOption>({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs);

    // 获取本地存储的用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
      this.globalData.hasUserInfo = true;
    }

    // 获取本地存储的手机号
    const phoneNumber = wx.getStorageSync('phoneNumber');
    if (phoneNumber) {
      this.globalData.phoneNumber = phoneNumber;
      this.globalData.hasPhoneNumber = true;
    }

    // 获取本地存储的用户ID
    const userId = wx.getStorageSync('userId');
    if (userId) {
      this.globalData.userId = userId;
    }

    // 检查登录状态
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    // 登录
    wx.login({
      success: res => {
        if (res.code) {
          // 发送 res.code 到后台换取 openId 和 session_uuid
          console.log('登录成功，code:', res.code);
          this.globalData.code = res.code;
          // 立即发起请求，不再用 setTimeout 延迟
          const that = this;
          wx.request({
            url: getBaseUrl() + '/api/users/openid',
            data: {
              code: res.code,
            },
            header: {
              'content-type': 'application/json',
            },
            timeout: 10000,
            success: (openidRes: any) => {
              console.log('调用openid的返回结果为：', openidRes);
              // 后端直接返回 UUID 字符串，不是 JSON 对象，所以 res.data 就是 UUID 本身
              const uuid = openidRes.data
              console.log('session_uuid为：', uuid);
              if (uuid) {
                that.globalData.sessionkey = uuid;
              }
              // 不再自动跳转登录页，用户可在"我的"页面点击"登录"按钮主动登录
            },
            fail: (err) => {
              console.error('获取openid失败', err);
            },
          });
        } else {
          console.error('登录失败', res);
        }
      },
      fail: err => {
        console.error('wx.login调用失败', err);
      },
    });
  },

  // 检查是否需要跳转到登录页
  checkNeedLogin() {
    // 如果没有用户信息或手机号，跳转到登录页
    if (!this.globalData.hasUserInfo || !this.globalData.hasPhoneNumber) {
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/login/login',
        });
      }, 1000);
    }
  },

  // 保存用户信息到本地存储
  saveUserInfo(userInfo: any) {
    if (userInfo) {
      wx.setStorageSync('userInfo', userInfo);
      this.globalData.userInfo = userInfo;
      this.globalData.hasUserInfo = true;
    }
  },

  // 保存手机号到本地存储
  savePhoneNumber(phoneNumber: string) {
    if (phoneNumber) {
      wx.setStorageSync('phoneNumber', phoneNumber);
      this.globalData.phoneNumber = phoneNumber;
      this.globalData.hasPhoneNumber = true;
    }
  },

  // 保存用户ID到本地存储
  saveUserId(userId: number) {
    if (userId) {
      wx.setStorageSync('userId', userId);
      this.globalData.userId = userId;
    }
  },

  globalData: {
    userInfo: null,
    hasUserInfo: false,
    phoneNumber: '',
    hasPhoneNumber: false,
    accessToken: null,
    refreshToken: null,
    userId: null,
    openid: null,
    sessionkey: null,
    code: null,
  } as GlobalData,
});

interface IAppOption {
  globalData: GlobalData;
  checkLoginStatus(): void;
  checkNeedLogin(): void;
  saveUserInfo(userInfo: any): void;
  savePhoneNumber(phoneNumber: string): void;
  saveUserId(userId: number): void;
}
