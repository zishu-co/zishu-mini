
// pages/login/login.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName'),
    phoneNumber: '',
    hasPhoneNumber: false,
    avatarUrl: null,
    nickName: null
  },

  onLoad() {
    // 检查是否可以使用 getUserProfile API
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
    
    // 检查是否已有用户信息
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    }
    
    // 检查是否已有手机号
    if (app.globalData.phoneNumber) {
      this.setData({
        phoneNumber: app.globalData.phoneNumber,
        hasPhoneNumber: true
      })
    }
  },

  // 获取用户信息
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        // 更新全局数据
        app.globalData.userInfo = res.userInfo
        app.globalData.hasUserInfo = true
        console.log(res.userInfo)
        
        // 保存到本地存储
        app.saveUserInfo(res.userInfo)
        
        // 更新页面数据
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
        
        wx.showToast({
          title: '获取用户信息成功',
          icon: 'success',
          duration: 2000
        })
      },
      fail: (err) => {
        console.error('获取用户信息失败', err)
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },
  // 获取用户头像
  getAvatar(e) {
    this.setData({
        avatarUrl: e.detail.avatarUrl
    })
  },
  getName(e) {
    this.setData({
        nickName: e.detail.value,
        hasUserInfo: true
    })
  },

  // 获取手机号
  getPhoneNumber(e) {
    let that = this
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      // 这里需要将encryptedData和iv发送到后端解密获取手机号
      // 由于需要后端支持，这里只做模拟
      let telparam = {
        sessionkey: app.globalData.sessionkey,
        encryptedData: e.detail.encryptedData,
        iv: e.detail.iv
      }
      console.log(telparam)
      console.log('加密的手机号信息：', e.detail)
      wx.request({
        url: 'http://127.0.0.1:8008/api/users/token_miniprogram',
        data: telparam,
        method: 'POST',
        header: {
          'content-type': 'application/json'
        },
        success: function (res) {
          console.log(res.data)
          app.globalData.phoneNumber = res.data.phone
          app.globalData.accessToken = res.data.atoken
          app.globalData.refreshToken = res.data.rtoken
          app.globalData.hasPhoneNumber = true
          app.savePhoneNumber(res.data.phone)
          // 更新页面数据
            that.setData({
                phoneNumber: res.data.phone,
                hasPhoneNumber: true
            })

          if (1 == res.data.status) {
            console.log(res)
          } 
        }
      })
      
      
      
      
      wx.showToast({
        title: '获取手机号成功',
        icon: 'success',
        duration: 2000
      })
    } else {
      console.error('获取手机号失败', e.detail.errMsg)
      wx.showToast({
        title: '获取手机号失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  // 完成登录，跳转到首页
  completeLogin() {
    if (this.data.hasUserInfo && this.data.hasPhoneNumber) {
      // 确保全局状态已更新
      app.globalData.hasUserInfo = true
      app.globalData.hasPhoneNumber = true
      app.globalData.userInfo = {avatarUrl:this.data.avatarUrl, nickName: this.data.nickName}
      wx.setStorageSync('userInfo', app.globalData.userInfo)
      wx.setStorageSync('accessToken', app.globalData.accessToken)
      wx.setStorageSync('refreshToken', app.globalData.refreshToken)
      
      // 跳转到首页
      wx.switchTab({
        url: '/pages/index/index',
      })
    } else {
      wx.showToast({
        title: '请先完成授权',
        icon: 'none',
        duration: 2000
      })
    }
  }
})