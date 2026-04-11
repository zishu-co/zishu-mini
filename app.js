// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 获取本地存储的用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
      this.globalData.hasUserInfo = true
    }

    // 获取本地存储的手机号
    const phoneNumber = wx.getStorageSync('phoneNumber')
    if (phoneNumber) {
      this.globalData.phoneNumber = phoneNumber
      this.globalData.hasPhoneNumber = true
    }

    // 检查登录状态
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus() {
    // 登录
    wx.login({
      success: res => {
        if (res.code) {
          // 发送 res.code 到后台换取 openId, sessionKey, unionId

          console.log('登录成功，code:', res.code)
          this.globalData.code = res.code
          // 由服务器调用微信接口获取openid
          setTimeout(() => {
            var that = this
            wx.request({
                url: 'http://127.0.0.1:8008/api/users/openid',
                data: {
                    code: res.code,
                },  
                header: {
                    'content-type': 'application/json',
                }, 
                success: function (res) {  
                    console.log("调用openid的返回结果为：",res)
                    console.log("openid为：",res.data.openid)
                    console.log("session_key为：",res.data.session_key)
                    that.globalData.openid = res.data.openid
                    that.globalData.sessionkey = res.data.session_key
                },
                fail: console.error
            })
            //const simulatedOpenid = 'simulated_openid_' + new Date().getTime()
            //this.globalData.openid = simulatedOpenid
            //console.log('获取到openid:', simulatedOpenid)
            
            // 检查是否需要跳转到登录页
            this.checkNeedLogin()
          }, 500)
        } else {
          console.error('登录失败', res)
        }
      },
      fail: err => {
        console.error('wx.login调用失败', err)
      }
    })
  },

  // 检查是否需要跳转到登录页
  checkNeedLogin() {
    // 如果没有用户信息或手机号，跳转到登录页
    if (!this.globalData.hasUserInfo || !this.globalData.hasPhoneNumber) {
      // 使用setTimeout避免在onLaunch中直接调用导航API可能出现的问题
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/login/login',
        })
      }, 1000)
    }
  },

  // 保存用户信息到本地存储
  saveUserInfo(userInfo) {
    if (userInfo) {
      wx.setStorageSync('userInfo', userInfo)
      this.globalData.userInfo = userInfo
      this.globalData.hasUserInfo = true
    }
  },

  // 保存手机号到本地存储
  savePhoneNumber(phoneNumber) {
    if (phoneNumber) {
      wx.setStorageSync('phoneNumber', phoneNumber)
      this.globalData.phoneNumber = phoneNumber
      this.globalData.hasPhoneNumber = true
    }
  },
  

  globalData: {
    userInfo: null,
    hasUserInfo: false,
    phoneNumber: null,
    hasPhoneNumber: false,
    accessToken: null,
    refreshToken: null,
    openid: null,
    sessionkey: null,
    code: null
  }
})