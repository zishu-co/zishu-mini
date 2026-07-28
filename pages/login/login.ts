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
    // ========== v2 改造：注册模式字段 ==========
    // mode: 'login' = 微信授权登录；'register' = 新用户注册模式
    mode: 'login' as 'login' | 'register',
    regName: '',         // 注册昵称
    regEmail: '',        // 注册邮箱
    regGender: '' as '男' | '女' | '', // v2 改造：后端 RegiMiniRequest.gender = Literal["男","女"]
    regNameError: '',    // 昵称校验错误提示
    regEmailError: '',   // 邮箱校验错误提示
    regGenderError: '',  // 性别校验错误提示
    canRegister: false,  // 注册按钮是否可点
    regSubmitting: false,// 注册请求进行中
    regErrorMsg: '',     // 注册接口错误提示
    // _pendingRegiData: token_miniprogram 404 时保存的 miniProgramToken，供注册时使用
    _pendingRegiData: null as any,
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

  // 获取用户头像（v2 改造：chooseAvatar 后同步设 hasUserInfo，让 completeLogin 通过）
  getAvatar(e: any) {
    this.setData({
      avatarUrl: e.detail.avatarUrl,
      hasUserInfo: true,
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
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      console.error('获取手机号失败', e.detail.errMsg)
      wx.showToast({ title: '获取手机号失败', icon: 'none', duration: 2000 })
      return
    }

    const sessionkey = _appLogin.globalData.sessionkey
    if (!sessionkey) {
      wx.showToast({ title: '授权凭证尚未就绪，请稍后再试', icon: 'none', duration: 2000 })
      console.error('[login] sessionkey(UUID) 为空，可能 /openid 请求尚未返回')
      return
    }

    console.log('=== getPhoneNumber 请求参数 ===', JSON.stringify({ sessionkey, encryptedData: '***', iv: e.detail.iv }))

    wx.showLoading({ title: '授权中...', mask: true })

    wx.request({
      url: getBaseUrl() + '/api/users/token_miniprogram',
      data: {
        sessionkey,
        encryptedData: e.detail.encryptedData,
        iv: e.detail.iv
      },
      method: 'POST',
      header: { 'content-type': 'application/json' },
      success: (res: any) => {
        wx.hideLoading()
        console.log('=== token_miniprogram 返回 ===')
        console.log('HTTP 状态码:', res.statusCode)
        console.log('响应数据:', JSON.stringify(res.data))

        // 用户不存在时后端返回 {detail: "用户不存在"} 或 {detail: {message: "用户不存在", phone: "xxx"}}
        const detail = res.data && res.data.detail
        const isUserNotFound = res.statusCode === 404 || (
          typeof detail === 'string' && detail === '用户不存在'
        ) || (
          typeof detail === 'object' && detail.message === '用户不存在'
        )

        if (isUserNotFound) {
          const phone = (typeof detail === 'object' && detail.phone) || ''
          console.warn('[login] 用户不存在，切换到注册模式, 手机号:', phone)
          that.setData({
            mode: 'register',
            regErrorMsg: '',
            phoneNumber: phone,
            hasPhoneNumber: true,
            _pendingRegiData: res.data || null,
          })
          return
        }

        // 后端返回成功但缺少关键字段
        if (!res.data || !res.data.phone) {
          console.error('[login] 后端返回缺少 phone 字段:', res.data)
          wx.showToast({
            title: '获取手机号失败，后端返回数据异常',
            icon: 'none',
            duration: 2500
          })
          return
        }

        console.log('[login] 用户已存在，手机号:', res.data.phone, '用户ID:', res.data.id)

        // 用户存在，保存信息
        _appLogin.globalData.phoneNumber = res.data.phone
        _appLogin.globalData.userId = res.data.id
        _appLogin.globalData.accessToken = res.data.atoken
        _appLogin.globalData.refreshToken = res.data.rtoken
        _appLogin.globalData.hasPhoneNumber = true
        _appLogin.savePhoneNumber(res.data.phone)
        _appLogin.saveUserId(res.data.id)
        wx.setStorageSync('accessToken', res.data.atoken)
        wx.setStorageSync('refreshToken', res.data.rtoken)

        if (res.data.username) {
          _appLogin.globalData.userInfo = {
            ...(_appLogin.globalData.userInfo || {}),
            nickName: res.data.username,
            userId: res.data.id,
          }
          wx.setStorageSync('userInfo', _appLogin.globalData.userInfo)
        }

        that.setData({
          phoneNumber: res.data.phone,
          hasPhoneNumber: true,
          userId: res.data.id
        })

        wx.showToast({ title: '获取手机号成功', icon: 'success', duration: 2000 })
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('[login] token_miniprogram 网络请求失败:', err)
        wx.showToast({ title: '网络错误，请重试', icon: 'none', duration: 2000 })
      }
    })
  },

  // 完成登录，跳转到首页
  completeLogin() {
    if (!this.data.hasPhoneNumber) {
      wx.showToast({
        title: '请先授权手机号',
        icon: 'none',
        duration: 2000
      })
      return
    }
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
    // v2 改造：隐私协议变更后同步更新注册按钮可点状态
    this._updateCanRegister()
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
  },

  // ========== v2 改造：注册模式方法 ==========

  /** 注册模式 → 返回登录模式 */
  onBackToLogin() {
    this.setData({
      mode: 'login',
      regName: '',
      regEmail: '',
      regGender: '',
      regNameError: '',
      regEmailError: '',
      regGenderError: '',
      regErrorMsg: '',
      canRegister: false,
      hasPhoneNumber: false,
      phoneNumber: '',
      _pendingRegiData: null,
    })
  },

  /** 注册昵称输入（v2 改造：按后端 RegiMiniRequest.name 规则 2-5 字） */
  onRegNameInput(e: any) {
    const v = (e.detail.value || '').trim()
    let err = ''
    if (v.length === 0) err = '请输入昵称'
    else if (v.length < 2) err = '昵称至少 2 个字'
    else if (v.length > 5) err = '昵称最多 5 个字'
    this.setData({ regName: v, regNameError: err })
    this._updateCanRegister()
  },

  /** 注册邮箱输入 */
  onRegEmailInput(e: any) {
    const v = (e.detail.value || '').trim()
    const err = v.length === 0 ? '请输入邮箱' : (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '邮箱格式不正确' : '')
    this.setData({ regEmail: v, regEmailError: err })
    this._updateCanRegister()
  },

  /** 注册性别选择 */
  onRegGenderChange(e: any) {
    const v = e.detail.value || ''
    const err = !v ? '请选择性别' : ''
    this.setData({ regGender: v, regGenderError: err })
    this._updateCanRegister()
  },

  /** 更新注册按钮可点状态 */
  _updateCanRegister() {
    const d: any = this.data
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.regEmail)
    const ok = d.regName.length > 0
      && d.regNameError === ''
      && emailOk
      && d.regGender !== ''
      && d.privacyAgreed
      && !d.regSubmitting
    this.setData({ canRegister: ok })
  },

  /** 提交注册 */
  submitRegister() {
    if (!this.data.canRegister) return
    if (!_appLogin.globalData.sessionkey) {
      wx.showToast({ title: '授权凭证失效，请返回重试', icon: 'none' })
      return
    }
    const pending: any = this.data._pendingRegiData || {}
    const body = {
      sessionkey: _appLogin.globalData.sessionkey,
      miniProgramToken: pending.miniProgramToken || pending.token || '',
      name: this.data.regName,
      email: this.data.regEmail,
      gender: this.data.regGender,
    }
    this.setData({ regSubmitting: true, regErrorMsg: '' })
    wx.showLoading({ title: '注册中...', mask: true })
    wx.request({
      url: getBaseUrl() + '/api/users/regi_miniprogram',
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: body,
      success: (res: any) => {
        wx.hideLoading()
        this.setData({ regSubmitting: false })
        if (res.statusCode >= 200 && res.statusCode < 300 && res.data && res.data.id) {
          // 注册成功：复用 token_miniprogram 成功路径保存信息
          _appLogin.globalData.phoneNumber = res.data.phone || this.data.phoneNumber || ''
          _appLogin.globalData.userId = res.data.id
          _appLogin.globalData.accessToken = res.data.atoken
          _appLogin.globalData.refreshToken = res.data.rtoken
          _appLogin.globalData.hasPhoneNumber = true
          _appLogin.savePhoneNumber(res.data.phone || this.data.phoneNumber || '')
          _appLogin.saveUserId(res.data.id)
          wx.setStorageSync('accessToken', res.data.atoken)
          wx.setStorageSync('refreshToken', res.data.rtoken)
          this.setData({
            phoneNumber: res.data.phone || this.data.phoneNumber || '',
            hasPhoneNumber: true,
            userId: res.data.id,
            mode: 'login',
          })
          wx.showToast({ title: '注册成功', icon: 'success' })
          setTimeout(() => {
            // 有头像昵称则跳首页；否则留在登录页让用户继续授权
            if (this.data.hasUserInfo) {
              wx.switchTab({ url: '/pages/aim/index' })
            }
          }, 800)
        } else {
          this.setData({ regErrorMsg: (res.data && (res.data.detail || res.data.message)) || '注册失败，请重试' })
        }
      },
      fail: () => {
        wx.hideLoading()
        this.setData({ regSubmitting: false, regErrorMsg: '网络错误，请重试' })
      },
    })
  },
})
