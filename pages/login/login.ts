// @ts-nocheck

// pages/login/login.ts
// IAppOption 和 IGlobalData 在 _appLogin.ts 中定义
const _appLogin = getApp<any>()
import { isDevMode, isLoggedIn } from '../../utils/env'
import { getBaseUrl } from '../../services/base'

type ILoginPageData = {
  userInfo: any;
  hasUserInfo: boolean;
  canIUseGetUserProfile: boolean;
  canIUseOpenData: boolean;
  phoneNumber: string;
  hasPhoneNumber: boolean;
  avatarUrl: string | null;
  nickName: string | null;
  userId: number | null;
  // Dev 模式新增字段
  isDev: boolean;
  loginMethod: string; // 'wechat' | 'password'
  phoneInput: string;
  pwdInput: string;
  canDevLogin: boolean;
  // 隐私政策勾选
  privacyAgreed: boolean;
};

Page<ILoginPageData, ILoginPageData>({
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName'),
    phoneNumber: '',
    hasPhoneNumber: false,
    avatarUrl: null,
    nickName: null,
    userId: null,
    // Dev 模式初始化
    isDev: false,
    loginMethod: 'wechat',
    phoneInput: '',
    pwdInput: '',
    canDevLogin: false,
    // 隐私政策勾选默认未勾选
    privacyAgreed: false,
  },

  onLoad() {
    // 检测环境
    const devMode = isDevMode()
    this.setData({ isDev: devMode })

    // Dev 模式下，如果已有 token 也算已登录，可以直接回跳
    if (devMode && isLoggedIn()) {
      console.log('[Dev模式] 已登录，直接跳转')
      wx.switchTab({ url: '/pages/aim/index' })
      return
    }

    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }

    // 检查是否已有用户信息
    if (_appLogin.globalData.userInfo) {
      this.setData({
        userInfo: _appLogin.globalData.userInfo,
        hasUserInfo: true
      })
    }

    // 检查是否已有手机号
    if (_appLogin.globalData.phoneNumber) {
      this.setData({
        phoneNumber: _appLogin.globalData.phoneNumber,
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
        _appLogin.globalData.userInfo = res.userInfo
        _appLogin.globalData.hasUserInfo = true
        console.log(res.userInfo)

        // 保存到本地存储
        _appLogin.saveUserInfo(res.userInfo)

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
  getAvatar(e: any) {
    this.setData({
      avatarUrl: e.detail.avatarUrl
    })
  },

  getName(e: any) {
    this.setData({
      nickName: e.detail.value,
      hasUserInfo: true
    })
  },

  // 获取手机号
  getPhoneNumber(e: any) {
    const that = this
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      const sessionkey = _appLogin.globalData.sessionkey
      if (!sessionkey) {
        wx.showToast({ title: '授权凭证尚未就绪，请稍后再试', icon: 'none', duration: 2000 })
        console.error('[login] sessionkey(UUID) 为空，可能 /openid 请求尚未返回')
        return
      }
      // 后端 TokenRequest：sessionkey 字段现在传 UUID，后端从 dict 取出真实 session_key 解密
      const telparam = {
        sessionkey: sessionkey,
        encryptedData: e.detail.encryptedData,
        iv: e.detail.iv
      }
      console.log(telparam)
      console.log('加密的手机号信息：', e.detail)
      wx.request({
        url: getBaseUrl() + '/api/users/token_miniprogram',
        data: telparam,
        method: 'POST',
        header: {
          'content-type': 'application/json'
        },
        success: (res: any) => {
          console.log(res.data)
          _appLogin.globalData.phoneNumber = res.data.phone
          _appLogin.globalData.userId = res.data.id
          _appLogin.globalData.accessToken = res.data.atoken
          _appLogin.globalData.refreshToken = res.data.rtoken
          _appLogin.globalData.hasPhoneNumber = true
          _appLogin.savePhoneNumber(res.data.phone)
          _appLogin.saveUserId(res.data.id)  // 保存 userId 到本地存储
          // 持久化 token 到本地存储，其他页面通过 storage 判断登录态
          wx.setStorageSync('accessToken', res.data.atoken)
          wx.setStorageSync('refreshToken', res.data.rtoken)
          // 更新页面数据
          that.setData({
            phoneNumber: res.data.phone,
            hasPhoneNumber: true,
            userId: res.data.id
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
    if (!this.data.privacyAgreed) {
      wx.showToast({
        title: '请先阅读并同意用户协议和隐私政策',
        icon: 'none',
        duration: 2500
      })
      return
    }
    if (this.data.hasUserInfo && this.data.hasPhoneNumber) {
      // 确保全局状态已更新
      _appLogin.globalData.hasUserInfo = true
      _appLogin.globalData.hasPhoneNumber = true
      _appLogin.globalData.userInfo = { avatarUrl: this.data.avatarUrl, nickName: this.data.nickName, userId: _appLogin.globalData.userId}
      wx.setStorageSync('userInfo', _appLogin.globalData.userInfo)
      wx.setStorageSync('accessToken', _appLogin.globalData.accessToken)
      wx.setStorageSync('refreshToken', _appLogin.globalData.refreshToken)

      // 跳转到首页
      wx.switchTab({
        url: '/pages/aim/index',
      })
    } else {
      wx.showToast({
        title: '请先完成授权',
        icon: 'none',
        duration: 2000
      })
    }
  },

  // ========== Dev 模式新增方法 ==========

  /** 切换登录方式 */
  onLoginMethodChange(e: any) {
    this.setData({ loginMethod: e.detail.value })
  },

  selectWechat() {
    this.setData({ loginMethod: 'wechat' })
  },

  selectPassword() {
    this.setData({ loginMethod: 'password' })
  },

  onPhoneInput(e: any) {
    const val = e.detail.value
    this.setData({
      phoneInput: val,
      canDevLogin: val.length >= 10 && this.data.pwdInput.length >= 4
    })
  },

  onPwdInput(e: any) {
    const val = e.detail.value
    this.setData({
      pwdInput: val,
      canDevLogin: this.data.phoneInput.length >= 10 && val.length >= 4
    })
  },

  /** 手机号+密码登录（Dev 模式） */
  loginByPassword() {
    if (!this.data.canDevLogin) return
    if (!this.data.privacyAgreed) {
      wx.showToast({
        title: '请先阅读并同意用户协议和隐私政策',
        icon: 'none',
        duration: 2500
      })
      return
    }

    const { phoneInput: phone, pwdInput: password } = this.data

    wx.showLoading({ title: '登录中...', mask: true })

    // 调用后端密码登录接口
    wx.request({
      url: getBaseUrl() + '/api/users/token',
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: { phone, password },
      success: (res: any) => {
        wx.hideLoading()
        const data = res.data
        if (data && data.id > 0) {
          // 登录成功，保存 token 和用户信息
          const userInfo = {
            userId: data.id,
            nickName: data.username || data.nickName || `用户${phone.slice(-4)}`,
            avatarUrl: ''
          }

          wx.setStorageSync('userInfo', userInfo)
          wx.setStorageSync('accessToken', data.atoken)
          wx.setStorageSync('refreshToken', data.rtoken)
          wx.setStorageSync('phoneNumber', data.phone || phone)
          // 清除游客标记
          wx.removeStorageSync('guestMode')

          _appLogin.globalData.userInfo = userInfo
          _appLogin.globalData.hasUserInfo = true
          _appLogin.globalData.phoneNumber = data.phone || phone
          _appLogin.globalData.hasPhoneNumber = true
          _appLogin.globalData.accessToken = data.atoken
          _appLogin.globalData.refreshToken = data.rtoken
          _appLogin.globalData.userId = data.id

          wx.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => {
            wx.switchTab({ url: '/pages/aim/index' })
          }, 1000)
        } else {
          wx.showToast({ title: data.message || '用户名或密码错误', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  /** 以游客身份进入（Dev 模式） */
  enterAsGuest() {
    wx.setStorageSync('guestMode', true)
    wx.switchTab({ url: '/pages/aim/index' })
  },

  // ========== 隐私政策相关方法 ==========

  /** 切换隐私协议勾选状态 */
  togglePrivacyAgreement() {
    this.setData({
      privacyAgreed: !this.data.privacyAgreed
    })
  },

  /** 查看隐私政策 */
  viewPrivacy() {
    wx.navigateTo({
      url: '/pages/privacy/index'
    })
  },

  /** 查看用户服务协议 */
  viewAgreement() {
    wx.navigateTo({
      url: '/pages/agreement/index'
    })
  }
})
