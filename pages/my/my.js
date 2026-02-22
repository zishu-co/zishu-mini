
// pages/my/my.js
const app = getApp()
Page({
  data: {
    // 页面的初始数据
    userInfo: null,
    hasUserInfo: false,
    phoneNumber: '',
    hasPhoneNumber: false
  },
  onLoad: function (options) {
    // 页面加载时执行，一个页面只会调用一次
    
    // 检查登录状态
    this.checkLoginStatus()
  },
  
  // 检查登录状态
  checkLoginStatus() {
    const app = getApp()
    // 如果没有用户信息或手机号，跳转到登录页
    if (!app.globalData.hasUserInfo || !app.globalData.hasPhoneNumber) {
      wx.navigateTo({
        url: '/pages/login/login',
      })
    } else {
      // 已登录，更新页面显示的用户信息
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true,
        phoneNumber: app.globalData.phoneNumber,
        hasPhoneNumber: true
      })
    }
  },
  onShow() {
    this.getTabBar().init();
  },
  
  logOut(){
    wx.setStorageSync('phoneNumber', null)
    wx.setStorageSync('userInfo', null)
    wx.setStorageSync('logs', null)
    app.globalData.userInfo = null
    app.globalData.hasUserInfo = false
    app.globalData.phoneNumber = null
    app.globalData.hasPhoneNumber = false
    this.setData({
        userInfo: null,
        hasUserInfo: false,
        phoneNumber: null,
        hasPhoneNumber: false
      })
    let phoneNumber = wx.getStorageSync('phoneNumber')
    console.log(phoneNumber)
},
})