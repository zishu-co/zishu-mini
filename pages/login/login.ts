// @ts-nocheck

// pages/login/login.ts
// IAppOption 和 IGlobalData 在 _appLogin.ts 中定义
const _appLogin = getApp<any>()
import { isDevMode, isLoggedIn } from '../../utils/env'
import { getBaseUrl } from '../../services/base'
import { registerUser, resetPasswordApply } from '../../services/user/user'

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
  submitting: boolean;
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
    submitting: false,
    // 隐私政策勾选默认未勾选
    privacyAgreed: false,
    // 101-regi.md & 111-reset-pass.md: 新塾员注册与忘记密码
    showRegiModal: false,
    submittingRegi: false,
    regiForm: {
      name: '',
      phone: '',
      email: '',
      password: '',
      gender: '男',
      notes: '',
    },
    showResetModal: false,
    resetPhone: '',
    submittingReset: false,
  },

  onShareAppMessage() {
    return {
      title: '学本领，上自塾 · 诺亚方舟共学与 AI 伴学平台',
      path: '/pages/login/login',
    }
  },

  onLoad() {
    // 检测环境
    const devMode = isDevMode()
    this.setData({ isDev: devMode })

    // 每次进入登录页都主动刷新一次微信登录 code 与 session_uuid，防止后端 TTLDict 过期
    if (_appLogin && typeof _appLogin.checkLoginStatus === 'function') {
      _appLogin.checkLoginStatus()
    }

    const hasValidToken = Boolean(wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken'))
    if (!hasValidToken && _appLogin && _appLogin.globalData) {
      // 清除内存中的残留过期 Token，防止 completeLogin 把旧 Token 写回 Storage 导致死循环
      _appLogin.globalData.accessToken = null
      _appLogin.globalData.refreshToken = null
    }

    // Dev 模式下，如果已有有效 token 也算已登录，可以直接回跳
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

    // 检查是否已有用户信息（兼容 globalData 与本地缓存，避免 completeLogin 覆盖为 null）
    const cachedUserInfo = _appLogin?.globalData?.userInfo || wx.getStorageSync('userInfo')
    if (cachedUserInfo) {
      const avatarUrl = cachedUserInfo.avatarUrl || null
      const nickName = cachedUserInfo.nickName || cachedUserInfo.name || null
      this.setData({
        userInfo: cachedUserInfo,
        avatarUrl,
        nickName,
        userId: cachedUserInfo.userId || cachedUserInfo.id || _appLogin?.globalData?.userId || wx.getStorageSync('userId') || null,
        hasUserInfo: Boolean((nickName && String(nickName).trim().length > 0) || avatarUrl)
      })
    }

    // 检查是否已有手机号（注意：仅当本地已有有效 Token 时才标记 hasPhoneNumber=true；
    // 若 Token 已过期被清除，必须保持 hasPhoneNumber=false 以展示「一键授权」重新换取 Token）
    const cachedPhone = _appLogin?.globalData?.phoneNumber || wx.getStorageSync('phoneNumber')
    if (cachedPhone) {
      this.setData({
        phoneNumber: cachedPhone,
        phoneInput: cachedPhone,
        canDevLogin: String(cachedPhone).length >= 10 && String(this.data.pwdInput || '').length >= 4,
        hasPhoneNumber: hasValidToken
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
          avatarUrl: res.userInfo.avatarUrl || this.data.avatarUrl,
          nickName: res.userInfo.nickName || this.data.nickName,
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
    const avatarUrl = e.detail.avatarUrl
    this.setData({
      avatarUrl,
      hasUserInfo: Boolean((this.data.nickName && this.data.nickName.trim().length > 0) || avatarUrl)
    })
  },

  getName(e: any) {
    const rawName = e.detail.value || ''
    const trimmed = rawName.trim()
    this.setData({
      nickName: rawName,
      hasUserInfo: trimmed.length > 0
    })
  },

  // 获取手机号
  getPhoneNumber(e: any) {
    const that = this
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      const sessionkey = _appLogin.globalData.sessionkey
      if (!sessionkey) {
        if (typeof _appLogin.checkLoginStatus === 'function') {
          _appLogin.checkLoginStatus()
        }
        wx.showToast({ title: '授权凭证初始化中，请再点一次', icon: 'none', duration: 2000 })
        console.error('[login] sessionkey(UUID) 为空，已触发重新获取 /openid')
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
          if (res.statusCode === 200 && res.data && res.data.atoken) {
            const resolvedName =
              (that.data.nickName && that.data.nickName.trim()) ||
              res.data.username ||
              res.data.nickName ||
              _appLogin.globalData.userInfo?.nickName ||
              `用户${String(res.data.phone || '').slice(-4)}`
            const nextUserInfo = {
              ...(_appLogin.globalData.userInfo || wx.getStorageSync('userInfo') || {}),
              userId: res.data.id,
              id: res.data.id,
              nickName: resolvedName,
              name: resolvedName,
              avatarUrl: that.data.avatarUrl || res.data.avatarUrl || _appLogin.globalData.userInfo?.avatarUrl || '',
              phoneNumber: res.data.phone || '',
              role: res.data.role || (_appLogin.globalData.userInfo || wx.getStorageSync('userInfo') || {}).role || '',
              is_admin: res.data.is_admin ?? (_appLogin.globalData.userInfo || wx.getStorageSync('userInfo') || {}).is_admin,
            }
            _appLogin.globalData.phoneNumber = res.data.phone
            _appLogin.globalData.userId = res.data.id
            _appLogin.globalData.accessToken = res.data.atoken
            _appLogin.globalData.refreshToken = res.data.rtoken
            _appLogin.globalData.hasPhoneNumber = true
            _appLogin.globalData.userInfo = nextUserInfo
            _appLogin.globalData.hasUserInfo = true
            _appLogin.savePhoneNumber(res.data.phone)
            _appLogin.saveUserId(res.data.id)
            // 立即写入 Storage，避免用户点击左上角返回时丢失 Token
            wx.setStorageSync('accessToken', res.data.atoken)
            wx.setStorageSync('refreshToken', res.data.rtoken || res.data.atoken)
            wx.setStorageSync('userId', res.data.id)
            wx.setStorageSync('userInfo', nextUserInfo)
            if (res.data.role) {
              wx.setStorageSync('userRole', res.data.role)
            }
            wx.removeStorageSync('guestMode')

            // 更新页面数据
            that.setData({
              phoneNumber: res.data.phone,
              phoneInput: res.data.phone || that.data.phoneInput,
              hasPhoneNumber: true,
              userId: res.data.id,
              nickName: that.data.nickName || resolvedName,
              hasUserInfo: true
            })

            wx.showToast({
              title: '获取手机号成功',
              icon: 'success',
              duration: 2000
            })
          } else {
            // 若 sessionkey 在后端过期导致解密失败，自动刷新一次 sessionkey
            if (typeof _appLogin.checkLoginStatus === 'function') {
              _appLogin.checkLoginStatus()
            }
            const detailMsg =
              typeof res.data?.detail === 'string'
                ? res.data.detail
                : res.data?.detail?.message || res.data?.message || '获取手机号失败，请重试或使用密码登录'
            wx.showToast({
              title: detailMsg,
              icon: 'none',
              duration: 2500
            })
          }
        },
        fail: (err: any) => {
          console.error('[login] token_miniprogram 请求失败', err)
          wx.showToast({
            title: '网络异常，获取手机号失败',
            icon: 'none',
            duration: 2000
          })
        }
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
    const activeAccessToken = wx.getStorageSync('accessToken') || _appLogin.globalData.accessToken || ''
    const activeRefreshToken = wx.getStorageSync('refreshToken') || _appLogin.globalData.refreshToken || ''
    if (!activeAccessToken && !activeRefreshToken) {
      this.setData({ hasPhoneNumber: false })
      wx.showToast({
        title: '请先点击手机号「一键授权」或使用密码登录',
        icon: 'none',
        duration: 2500
      })
      return
    }
    if (this.data.hasUserInfo && this.data.hasPhoneNumber) {
      const prevInfo = _appLogin.globalData.userInfo || wx.getStorageSync('userInfo') || {}
      const resolvedUserId = this.data.userId || _appLogin.globalData.userId || prevInfo.userId || wx.getStorageSync('userId')
      // 确保全局状态已更新
      _appLogin.globalData.hasUserInfo = true
      _appLogin.globalData.hasPhoneNumber = true
      _appLogin.globalData.userInfo = {
        ...prevInfo,
        avatarUrl: this.data.avatarUrl || prevInfo.avatarUrl || '',
        nickName: (this.data.nickName && this.data.nickName.trim()) || prevInfo.nickName || '',
        userId: resolvedUserId
      }
      wx.setStorageSync('userInfo', _appLogin.globalData.userInfo)
      if (resolvedUserId) {
        wx.setStorageSync('userId', resolvedUserId)
      }
      if (activeAccessToken) {
        wx.setStorageSync('accessToken', activeAccessToken)
        _appLogin.globalData.accessToken = activeAccessToken
      }
      if (activeRefreshToken) {
        wx.setStorageSync('refreshToken', activeRefreshToken)
        _appLogin.globalData.refreshToken = activeRefreshToken
      }
      wx.removeStorageSync('guestMode')

      // 跳转到首页
      wx.switchTab({
        url: '/pages/aim/index',
      })
    } else {
      wx.showToast({
        title: '请先完成昵称与手机号授权',
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
    if (!this.data.canDevLogin || this.data.submitting) return
    if (!this.data.privacyAgreed) {
      wx.showToast({
        title: '请先阅读并同意用户协议和隐私政策',
        icon: 'none',
        duration: 2500
      })
      return
    }

    const { phoneInput: phone, pwdInput: password } = this.data
    this.setData({ submitting: true })
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
        this.setData({ submitting: false })
        const data = res.data
        if (res.statusCode === 200 && data && data.id > 0) {
          // 登录成功，保存 token 和用户信息
          const userInfo: any = {
            userId: data.id,
            id: data.id,
            nickName: data.username || data.nickName || `用户${phone.slice(-4)}`,
            avatarUrl: data.avatarUrl || '',
            role: data.role || '',
            is_admin: data.is_admin,
          }
          if (data.gender) {
            userInfo.gender = data.gender
          }

          wx.setStorageSync('userInfo', userInfo)
          if (data.role) {
            wx.setStorageSync('userRole', data.role)
          }
          wx.setStorageSync('userId', data.id)
          wx.setStorageSync('accessToken', data.atoken)
          wx.setStorageSync('refreshToken', data.rtoken)
          wx.setStorageSync('phoneNumber', data.phone || phone)
          if (typeof _appLogin.saveUserId === 'function') {
            _appLogin.saveUserId(data.id)
          }
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
          wx.showToast({ title: data?.detail || data?.message || '用户名或密码错误', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        this.setData({ submitting: false })
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  /** 以游客身份进入（Dev 模式） */
  enterAsGuest() {
    wx.setStorageSync('guestMode', true)
    wx.switchTab({ url: '/pages/aim/index' })
  },

  // ── 101-regi.md: 新塾员入塾注册申请 (/api/users/register) ──
  onOpenRegiModal() {
    this.setData({
      showRegiModal: true,
      regiForm: {
        name: this.data.nickName || '',
        phone: this.data.phoneInput || this.data.phoneNumber || '',
        email: '',
        password: '',
        gender: '男',
        notes: '',
      },
    })
  },

  onCloseRegiModal() {
    this.setData({ showRegiModal: false })
  },

  onRegiFieldInput(e: any) {
    const field = e.currentTarget.dataset.field
    if (!field) return
    this.setData({
      [`regiForm.${field}`]: e.detail.value,
    })
  },

  onSelectRegiGender(e: any) {
    const g = e.currentTarget.dataset.gender || '男'
    this.setData({ 'regiForm.gender': g })
  },

  async onSubmitRegister() {
    const f = this.data.regiForm
    if (!String(f.name || '').trim()) {
      wx.showToast({ title: '请输入真实姓名/昵称', icon: 'none' })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(String(f.phone || '').trim())) {
      wx.showToast({ title: '请输入有效的11位手机号', icon: 'none' })
      return
    }
    if (!String(f.password || '').trim() || String(f.password).length < 4) {
      wx.showToast({ title: '请设置至少4位登录密码', icon: 'none' })
      return
    }
    this.setData({ submittingRegi: true })
    try {
      const res: any = await registerUser({
        name: f.name.trim(),
        phone: f.phone.trim(),
        email: (f.email || `${f.phone.trim()}@zishu.co`).trim(),
        password: f.password.trim(),
        gender: f.gender || '男',
        notes: (f.notes || '小程序自主申请入塾').trim(),
      })
      if (res && (res.code === 200 || res.code === '200')) {
        wx.showToast({ title: '🎉 入塾申请已提交！', icon: 'success' })
        this.setData({
          showRegiModal: false,
          phoneInput: f.phone.trim(),
          pwdInput: f.password.trim(),
          canDevLogin: true,
        })
      } else {
        wx.showToast({ title: res?.message || '该手机号已注册，请直接登录', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '提交注册申请失败', icon: 'none' })
    } finally {
      this.setData({ submittingRegi: false })
    }
  },

  // ── 111-reset-pass.md: 申请重置密码 (/api/users/reset_pass) ──
  onOpenResetModal() {
    this.setData({
      showResetModal: true,
      resetPhone: this.data.phoneInput || this.data.phoneNumber || '',
    })
  },

  onCloseResetModal() {
    this.setData({ showResetModal: false })
  },

  onResetPhoneInput(e: any) {
    this.setData({ resetPhone: e.detail.value })
  },

  async onSubmitResetPass() {
    const phone = String(this.data.resetPhone || '').trim()
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '请输入注册时的11位手机号', icon: 'none' })
      return
    }
    this.setData({ submittingReset: true })
    try {
      const res: any = await resetPasswordApply(phone)
      if (res && Number(res.code) === 200) {
        wx.showToast({ title: `🔑 已提交重置申请（第${res.times || 1}次）`, icon: 'none' })
        this.setData({ showResetModal: false })
      } else {
        wx.showToast({ title: '未找到该手机号对应的账号', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '提交申请失败', icon: 'none' })
    } finally {
      this.setData({ submittingReset: false })
    }
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
