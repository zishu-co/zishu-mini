// @ts-nocheck

// pages/login/login.ts
const _appLogin = getApp<any>()
import { isDevMode, isLoggedIn } from '../../utils/env'
import { getBaseUrl } from '../../services/base'
import { resetPasswordApply } from '../../services/user/user'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type ILoginPageData = {
  userInfo: any;
  hasUserInfo: boolean;
  hasNickName: boolean;
  canIUseGetUserProfile: boolean;
  canIUseOpenData: boolean;
  phoneNumber: string;
  hasPhoneNumber: boolean;
  avatarUrl: string | null;
  nickName: string | null;
  userId: number | null;
  isDev: boolean;
  loginMethod: string; // 'wechat' | 'password'
  phoneInput: string;
  pwdInput: string;
  canDevLogin: boolean;
  submitting: boolean;
  privacyAgreed: boolean;
  // v2.1 原地注册登录模式字段
  mode: 'login' | 'register';
  regName: string;
  regGender: '男' | '女' | '';
  regEmail: string;
  regPassword: string;
  showRegPwd: boolean;
  emailValid: boolean;
  pwdValid: boolean;
  regNameError: string;
  regGenderError: string;
  regEmailError: string;
  regPasswordError: string;
  canRegister: boolean;
  regSubmitting: boolean;
  regErrorMsg: string;
  _pendingRegiData: any;
  _encryptedData: string;
  _iv: string;
  // 密码重置弹窗
  showResetModal: boolean;
  resetPhone: string;
  submittingReset: boolean;
};

Page<ILoginPageData, any>({
  data: {
    userInfo: null,
    hasUserInfo: false,
    hasNickName: false,
    canIUseGetUserProfile: false,
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName'),
    phoneNumber: '',
    hasPhoneNumber: false,
    avatarUrl: null,
    nickName: null,
    userId: null,
    isDev: false,
    loginMethod: 'wechat',
    phoneInput: '',
    pwdInput: '',
    canDevLogin: false,
    submitting: false,
    privacyAgreed: false,
    // v2.1 原地注册登录状态
    mode: 'login',
    regName: '',
    regGender: '',
    regEmail: '',
    regPassword: '',
    showRegPwd: false,
    emailValid: false,
    pwdValid: false,
    regNameError: '',
    regGenderError: '',
    regEmailError: '',
    regPasswordError: '',
    canRegister: false,
    regSubmitting: false,
    regErrorMsg: '',
    _pendingRegiData: null,
    _encryptedData: '',
    _iv: '',
    // 111-reset-pass.md: 忘记密码重置
    showResetModal: false,
    resetPhone: '',
    submittingReset: false,
  },

  noop() {},

  onShareAppMessage() {
    return {
      title: '学本领，上自塾 · 诺亚方舟共学与 AI 伴学平台',
      path: '/pages/login/login',
    }
  },

  onLoad(options?: any) {
    if (options && options.redirect) {
      (this as any)._redirectUrl = decodeURIComponent(options.redirect)
    }

    const devMode = isDevMode()
    this.setData({ isDev: devMode })

    // 仅在无 sessionkey 或距上次获取已超过 5 分钟时刷新微信 code，避免并发覆盖刚就绪的 session_key
    const lastUpdatedAt = Number((_appLogin?.globalData as any)?.sessionkeyUpdatedAt || 0)
    const sessionFresh = Boolean(_appLogin?.globalData?.sessionkey) && (Date.now() - lastUpdatedAt < 5 * 60 * 1000)
    if (!sessionFresh && _appLogin && typeof _appLogin.checkLoginStatus === 'function') {
      _appLogin.checkLoginStatus()
    }

    const hasValidToken = Boolean(wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken'))
    if (!hasValidToken && _appLogin && _appLogin.globalData) {
      _appLogin.globalData.accessToken = null
      _appLogin.globalData.refreshToken = null
    }

    if (devMode && isLoggedIn()) {
      wx.switchTab({ url: '/pages/aim/index' })
      return
    }

    if (wx.getUserProfile) {
      this.setData({ canIUseGetUserProfile: true })
    }

    const cachedUserInfo = _appLogin?.globalData?.userInfo || wx.getStorageSync('userInfo')
    if (cachedUserInfo) {
      const avatarUrl = cachedUserInfo.avatarUrl || null
      const nickName = cachedUserInfo.nickName || cachedUserInfo.name || null
      const trimmedNick = nickName ? String(nickName).trim() : ''
      this.setData({
        userInfo: cachedUserInfo,
        avatarUrl,
        nickName: trimmedNick || null,
        regName: trimmedNick,
        hasNickName: trimmedNick.length > 0,
        userId: cachedUserInfo.userId || cachedUserInfo.id || _appLogin?.globalData?.userId || wx.getStorageSync('userId') || null,
        hasUserInfo: Boolean(trimmedNick.length > 0 || avatarUrl),
      })
    }

    const cachedPhone = _appLogin?.globalData?.phoneNumber || wx.getStorageSync('phoneNumber')
    if (cachedPhone) {
      this.setData({
        phoneNumber: cachedPhone,
        phoneInput: cachedPhone,
        canDevLogin: String(cachedPhone).length >= 10 && String(this.data.pwdInput || '').length >= 4,
        hasPhoneNumber: hasValidToken,
      })
    }
  },

  /** 登录/注册成功后统一进入应用 */
  _enterHomeAfterAuth() {
    const redirectUrl = (this as any)._redirectUrl
    if (redirectUrl && typeof redirectUrl === 'string' && redirectUrl.startsWith('/')) {
      wx.redirectTo({
        url: redirectUrl,
        fail: () => {
          wx.switchTab({ url: '/pages/aim/index' })
        },
      })
      return
    }
    wx.switchTab({ url: '/pages/aim/index' })
  },

  /** 持久化登录凭证与用户信息 */
  _persistAuthSession(payload: {
    id: number;
    atoken: string;
    rtoken?: string;
    phone?: string;
    username?: string;
    role?: string;
    is_admin?: boolean;
    gender?: string;
    email?: string;
  }) {
    const prevInfo = _appLogin?.globalData?.userInfo || wx.getStorageSync('userInfo') || {}
    const chosenNick = (this.data.nickName && this.data.nickName.trim()) || (this.data.regName && this.data.regName.trim()) || ''
    const resolvedName =
      chosenNick ||
      payload.username ||
      prevInfo.nickName ||
      prevInfo.name ||
      `用户${String(payload.phone || this.data.phoneNumber || '').slice(-4)}`
    const resolvedAvatar = this.data.avatarUrl || prevInfo.avatarUrl || ''
    const resolvedPhone = payload.phone || this.data.phoneNumber || prevInfo.phoneNumber || ''
    const resolvedRole = payload.role || prevInfo.role || wx.getStorageSync('userRole') || ''
    const nextUserInfo: any = {
      ...prevInfo,
      userId: payload.id,
      id: payload.id,
      nickName: resolvedName,
      name: resolvedName,
      avatarUrl: resolvedAvatar,
      phoneNumber: resolvedPhone,
      role: resolvedRole,
      is_admin: payload.is_admin ?? prevInfo.is_admin,
    }
    if (payload.gender || this.data.regGender) {
      nextUserInfo.gender = payload.gender || this.data.regGender
    }
    if (payload.email || this.data.regEmail) {
      nextUserInfo.email = payload.email || this.data.regEmail
    }

    if (_appLogin && _appLogin.globalData) {
      _appLogin.globalData.phoneNumber = resolvedPhone
      _appLogin.globalData.userId = payload.id
      _appLogin.globalData.accessToken = payload.atoken
      _appLogin.globalData.refreshToken = payload.rtoken || payload.atoken
      _appLogin.globalData.hasPhoneNumber = true
      _appLogin.globalData.userInfo = nextUserInfo
      _appLogin.globalData.hasUserInfo = true
    }
    if (_appLogin && typeof _appLogin.savePhoneNumber === 'function' && resolvedPhone) {
      _appLogin.savePhoneNumber(resolvedPhone)
    }
    if (_appLogin && typeof _appLogin.saveUserId === 'function') {
      _appLogin.saveUserId(payload.id)
    }

    wx.setStorageSync('accessToken', payload.atoken)
    wx.setStorageSync('refreshToken', payload.rtoken || payload.atoken)
    wx.setStorageSync('userId', payload.id)
    wx.setStorageSync('userInfo', nextUserInfo)
    if (resolvedPhone) {
      wx.setStorageSync('phoneNumber', resolvedPhone)
    }
    if (resolvedRole) {
      wx.setStorageSync('userRole', resolvedRole)
    }
    wx.removeStorageSync('guestMode')

    this.setData({
      phoneNumber: resolvedPhone,
      phoneInput: resolvedPhone || this.data.phoneInput,
      hasPhoneNumber: true,
      userId: payload.id,
      nickName: resolvedName,
      regName: resolvedName,
      hasNickName: Boolean(resolvedName),
      hasUserInfo: true,
      userInfo: nextUserInfo,
    })

    // 若用户刚选择了本地临时头像文件，后台静默上传，不阻塞主流程跳转
    if (
      resolvedAvatar &&
      (resolvedAvatar.startsWith('wxfile://') || resolvedAvatar.startsWith('http://tmp/')) &&
      typeof wx.uploadFile === 'function'
    ) {
      try {
        wx.uploadFile({
          url: getBaseUrl() + '/api/users/save_profile',
          filePath: resolvedAvatar,
          name: 'file',
          formData: { id: String(payload.id) },
          header: { token: payload.atoken },
        })
      } catch {}
    }
  },

  // 获取用户信息（兼容旧版 API）
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        if (_appLogin && _appLogin.globalData) {
          _appLogin.globalData.userInfo = res.userInfo
          _appLogin.globalData.hasUserInfo = true
        }
        if (_appLogin && typeof _appLogin.saveUserInfo === 'function') {
          _appLogin.saveUserInfo(res.userInfo)
        }
        const nick = res.userInfo.nickName || this.data.nickName || ''
        this.setData({
          userInfo: res.userInfo,
          avatarUrl: res.userInfo.avatarUrl || this.data.avatarUrl,
          nickName: nick,
          regName: nick.trim(),
          hasNickName: nick.trim().length > 0,
          hasUserInfo: true,
        })
        this._updateCanRegister()
      },
      fail: () => {
        wx.showToast({ title: '获取用户信息失败', icon: 'none', duration: 2000 })
      },
    })
  },

  // Step 1a: 获取用户头像
  getAvatar(e: any) {
    const avatarUrl = e?.detail?.avatarUrl || ''
    if (!avatarUrl) return
    this.setData({
      avatarUrl,
      hasUserInfo: true,
    })
    this._updateCanRegister()
  },

  // Step 1b: 获取或输入用户昵称
  getName(e: any) {
    const rawName = e?.detail?.value ?? ''
    const trimmed = String(rawName).trim()
    let nameErr = ''
    if (this.data.mode === 'register') {
      if (!trimmed) nameErr = '请获取或输入昵称'
      else if (trimmed.length > 20) nameErr = '昵称最多 20 个字'
    }
    this.setData({
      nickName: rawName,
      regName: trimmed,
      hasNickName: trimmed.length > 0,
      hasUserInfo: Boolean(trimmed.length > 0 || this.data.avatarUrl),
      regNameError: nameErr,
    })
    this._updateCanRegister()
  },

  onNickNameBlur(e: any) {
    const rawName = e?.detail?.value ?? this.data.nickName ?? ''
    const trimmed = String(rawName).trim()
    let nameErr = ''
    if (this.data.mode === 'register' && !trimmed) {
      nameErr = '请获取或输入昵称'
    }
    this.setData({
      nickName: trimmed,
      regName: trimmed,
      hasNickName: trimmed.length > 0,
      hasUserInfo: Boolean(trimmed.length > 0 || this.data.avatarUrl),
      regNameError: nameErr,
    })
    this._updateCanRegister()
  },

  // Step 2: 授权手机号 -> 老用户直接进入 / 新用户静默切换原地注册模式
  getPhoneNumber(e: any) {
    const that = this
    if (!e?.detail || e.detail.errMsg !== 'getPhoneNumber:ok') {
      if (e?.detail?.errMsg && !String(e.detail.errMsg).includes('cancel') && !String(e.detail.errMsg).includes('deny')) {
        wx.showToast({ title: '手机号授权未完成，请重试', icon: 'none', duration: 2000 })
      }
      return
    }

    const encryptedData = e.detail.encryptedData
    const iv = e.detail.iv
    const invokeTokenExchange = (sessionkey: string) => {
      that.setData({
        _encryptedData: encryptedData,
        _iv: iv,
      })

      wx.showLoading({ title: '正在验证身份...', mask: true })
      wx.request({
        url: getBaseUrl() + '/api/users/token_miniprogram',
        data: {
          sessionkey,
          encryptedData,
          iv,
        },
        method: 'POST',
        header: {
          'content-type': 'application/json',
        },
        success: (res: any) => {
          wx.hideLoading()
          const detail = res.data && res.data.detail
          const isUserNotFound =
            res.statusCode === 404 ||
            (typeof detail === 'string' && detail.includes('用户不存在')) ||
            (typeof detail === 'object' && detail && String(detail.message || '').includes('用户不存在'))

          // Step 4: 用户不存在 -> 不弹“用户不存在”提示，保留当前 sessionkey，原地展开性别、邮箱、密码注册表单
          if (isUserNotFound) {
            const phone = (typeof detail === 'object' && detail?.phone) || ''
            const currentNick = String(that.data.nickName || '').trim()
            that.setData({
              mode: 'register',
              loginMethod: 'wechat',
              phoneNumber: phone,
              hasPhoneNumber: true,
              regName: currentNick,
              regNameError: '',
              regErrorMsg: '',
              _pendingRegiData: res.data || null,
            })
            that._updateCanRegister()
            return
          }

          // Step 3: 用户存在 -> 保存登录凭证并直接进入首页
          if (res.statusCode === 200 && res.data && res.data.atoken) {
            that._persistAuthSession({
              id: res.data.id,
              atoken: res.data.atoken,
              rtoken: res.data.rtoken,
              phone: res.data.phone,
              username: res.data.username || res.data.nickName,
              role: res.data.role,
              is_admin: res.data.is_admin,
              gender: res.data.gender,
              email: res.data.email,
            })

            // 若用户在第 1 步主动输入了新昵称且与后端原昵称不同，静默同步至个人资料
            const customNick = String(that.data.nickName || '').trim()
            if (customNick && res.data.username && customNick !== res.data.username) {
              wx.request({
                url: getBaseUrl() + '/api/users/submit_profile',
                method: 'POST',
                header: {
                  'content-type': 'application/json',
                  token: res.data.atoken,
                },
                data: { info: JSON.stringify({ name: customNick }) },
              })
            }

            wx.showToast({
              title: '登录成功',
              icon: 'success',
              duration: 1200,
            })
            setTimeout(() => {
              that._enterHomeAfterAuth()
            }, 400)
            return
          }

          // 会话过期或解密异常时刷新 sessionkey，提示用户再点一次授权
          if (_appLogin && typeof _appLogin.checkLoginStatus === 'function') {
            _appLogin.checkLoginStatus()
          }
          const detailMsg =
            typeof detail === 'string'
              ? detail
              : detail?.message || res.data?.message || '授权凭证已过期，请再点击一次授权'
          wx.showToast({
            title: detailMsg,
            icon: 'none',
            duration: 2500,
          })
        },
        fail: () => {
          wx.hideLoading()
          wx.showToast({
            title: '网络异常，请稍后重试',
            icon: 'none',
            duration: 2000,
          })
        },
      })
    }

    const currentSessionKey = _appLogin?.globalData?.sessionkey
    if (currentSessionKey) {
      invokeTokenExchange(currentSessionKey)
      return
    }

    if (_appLogin && typeof _appLogin.checkLoginStatus === 'function') {
      _appLogin.checkLoginStatus()
    }
    wx.showToast({ title: '授权凭证已就绪，请再点击一次', icon: 'none', duration: 2000 })
  },

  // 手动点击底部「完成授权并进入」兜底入口
  completeLogin() {
    const activeAccessToken = wx.getStorageSync('accessToken') || _appLogin?.globalData?.accessToken || ''
    const activeRefreshToken = wx.getStorageSync('refreshToken') || _appLogin?.globalData?.refreshToken || ''
    if (!activeAccessToken && !activeRefreshToken) {
      this.setData({ hasPhoneNumber: false })
      wx.showToast({
        title: '请先点击手机号「一键授权」',
        icon: 'none',
        duration: 2200,
      })
      return
    }
    if (!this.data.privacyAgreed) {
      wx.showToast({
        title: '请先阅读并同意用户服务协议和隐私政策',
        icon: 'none',
        duration: 2500,
      })
      return
    }
    const prevInfo = _appLogin?.globalData?.userInfo || wx.getStorageSync('userInfo') || {}
    const resolvedUserId = this.data.userId || _appLogin?.globalData?.userId || prevInfo.userId || wx.getStorageSync('userId') || 0
    this._persistAuthSession({
      id: Number(resolvedUserId),
      atoken: activeAccessToken,
      rtoken: activeRefreshToken || activeAccessToken,
      phone: this.data.phoneNumber || prevInfo.phoneNumber || '',
      username: (this.data.nickName && this.data.nickName.trim()) || prevInfo.nickName || '',
      role: prevInfo.role || '',
      is_admin: prevInfo.is_admin,
    })
    this._enterHomeAfterAuth()
  },

  // ========== 原地注册登录方法（v2.1） ==========

  onBackToLogin() {
    this.setData({
      mode: 'login',
      regGender: '',
      regEmail: '',
      regPassword: '',
      showRegPwd: false,
      emailValid: false,
      pwdValid: false,
      regNameError: '',
      regGenderError: '',
      regEmailError: '',
      regPasswordError: '',
      regErrorMsg: '',
      canRegister: false,
      hasPhoneNumber: false,
      phoneNumber: '',
      _pendingRegiData: null,
      _encryptedData: '',
      _iv: '',
    })
  },

  onSelectRegGender(e: any) {
    const gender = e?.currentTarget?.dataset?.gender || ''
    if (gender !== '男' && gender !== '女') return
    this.setData({
      regGender: gender,
      regGenderError: '',
      regErrorMsg: '',
    })
    this._updateCanRegister()
  },

  onRegEmailInput(e: any) {
    const v = String(e?.detail?.value || '').trim()
    const valid = EMAIL_REGEX.test(v)
    const err = v.length === 0 ? '' : (valid ? '' : '请输入正确的邮箱格式')
    this.setData({
      regEmail: v,
      emailValid: valid,
      regEmailError: err,
      regErrorMsg: '',
    })
    this._updateCanRegister()
  },

  onEmailBlur(e: any) {
    const v = String(e?.detail?.value ?? this.data.regEmail ?? '').trim()
    const valid = EMAIL_REGEX.test(v)
    const err = v.length === 0 ? '请输入常用邮箱' : (valid ? '' : '请输入正确的邮箱格式')
    this.setData({
      regEmail: v,
      emailValid: valid,
      regEmailError: err,
    })
    this._updateCanRegister()
  },

  onRegPasswordInput(e: any) {
    const v = String(e?.detail?.value || '')
    const valid = v.trim().length >= 6
    const err = v.length === 0 ? '' : (valid ? '' : '密码至少需要 6 位字符')
    this.setData({
      regPassword: v,
      pwdValid: valid,
      regPasswordError: err,
      regErrorMsg: '',
    })
    this._updateCanRegister()
  },

  onPasswordBlur(e: any) {
    const v = String(e?.detail?.value ?? this.data.regPassword ?? '')
    const valid = v.trim().length >= 6
    const err = v.trim().length === 0 ? '请设置登录密码' : (valid ? '' : '密码至少需要 6 位字符')
    this.setData({
      regPassword: v,
      pwdValid: valid,
      regPasswordError: err,
    })
    this._updateCanRegister()
  },

  toggleShowRegPwd() {
    this.setData({ showRegPwd: !this.data.showRegPwd })
  },

  _updateCanRegister() {
    const d = this.data
    const nameStr = String(d.nickName || d.regName || '').trim()
    const ok =
      nameStr.length >= 1 &&
      nameStr.length <= 20 &&
      (d.regGender === '男' || d.regGender === '女') &&
      EMAIL_REGEX.test(String(d.regEmail || '').trim()) &&
      String(d.regPassword || '').trim().length >= 6 &&
      Boolean(d.hasPhoneNumber) &&
      !d.regSubmitting
    this.setData({
      hasNickName: nameStr.length > 0,
      emailValid: EMAIL_REGEX.test(String(d.regEmail || '').trim()),
      pwdValid: String(d.regPassword || '').trim().length >= 6,
      canRegister: ok && Boolean(d.privacyAgreed),
    })
  },

  /** 执行原地注册并直接登录 */
  submitRegister() {
    if (this.data.regSubmitting) return

    const fullName = String(this.data.nickName || this.data.regName || '').trim()
    const gender = this.data.regGender
    const email = String(this.data.regEmail || '').trim()
    const password = String(this.data.regPassword || '').trim()

    if (!fullName) {
      this.setData({ regNameError: '请先在上方获取或输入昵称' })
      wx.showToast({ title: '请先获取或输入昵称', icon: 'none' })
      return
    }
    if (gender !== '男' && gender !== '女') {
      this.setData({ regGenderError: '请选择性别' })
      wx.showToast({ title: '请选择性别', icon: 'none' })
      return
    }
    if (!EMAIL_REGEX.test(email)) {
      this.setData({ regEmailError: '请输入正确的邮箱格式' })
      wx.showToast({ title: '请输入正确的邮箱地址', icon: 'none' })
      return
    }
    if (password.length < 6) {
      this.setData({ regPasswordError: '密码至少需要 6 位字符' })
      wx.showToast({ title: '请设置至少6位登录密码', icon: 'none' })
      return
    }

    if (!this.data.privacyAgreed) {
      wx.showModal({
        title: '服务协议与隐私政策',
        content: '注册并登录即代表您已阅读并同意《用户服务协议》与《隐私政策》',
        confirmText: '同意注册',
        cancelText: '取消',
        success: (modalRes) => {
          if (modalRes.confirm) {
            this.setData({ privacyAgreed: true })
            this._updateCanRegister()
            this._doSubmitRegisterRequest(fullName, gender, email, password)
          }
        },
      })
      return
    }

    this._doSubmitRegisterRequest(fullName, gender, email, password)
  },

  _doSubmitRegisterRequest(fullName: string, gender: '男' | '女', email: string, password: string) {
    const sessionkey = _appLogin?.globalData?.sessionkey
    if (!sessionkey || !this.data._encryptedData || !this.data._iv) {
      if (_appLogin && typeof _appLogin.checkLoginStatus === 'function') {
        _appLogin.checkLoginStatus()
      }
      this.setData({
        hasPhoneNumber: false,
        regErrorMsg: '手机号授权凭证已过期，请点击上方「一键授权」重新验证手机号',
      })
      wx.showToast({ title: '请重新点击手机号一键授权', icon: 'none' })
      return
    }

    const postRegi = (submitName: string): Promise<any> =>
      new Promise((resolve, reject) => {
        wx.request({
          url: getBaseUrl() + '/api/users/regi_miniprogram',
          method: 'POST',
          header: { 'content-type': 'application/json' },
          data: {
            sessionkey,
            encryptedData: this.data._encryptedData,
            iv: this.data._iv,
            name: submitName,
            email,
            gender,
            password,
          },
          success: (res) => resolve(res),
          fail: (err) => reject(err),
        })
      })

    const syncPostRegisterFields = (atoken: string, registeredName: string): Promise<void> => {
      const tasks: Promise<any>[] = []
      // 同步用户设置的登录密码（兼容尚未更新 regi_miniprogram password 字段的线上旧版后端）
      tasks.push(
        new Promise((resolve) => {
          wx.request({
            url: getBaseUrl() + '/api/users/handle_changepass',
            method: 'POST',
            header: {
              'content-type': 'application/json',
              token: atoken,
            },
            data: {
              name: registeredName || fullName,
              newpass: password,
            },
            complete: () => resolve(true),
          })
        })
      )
      // 若因旧后端 2-5 字限制使用了截断兼容名，注册后立即恢复完整昵称
      if (registeredName !== fullName) {
        tasks.push(
          new Promise((resolve) => {
            wx.request({
              url: getBaseUrl() + '/api/users/submit_profile',
              method: 'POST',
              header: {
                'content-type': 'application/json',
                token: atoken,
              },
              data: {
                info: JSON.stringify({ name: fullName, gender }),
              },
              complete: () => resolve(true),
            })
          })
        )
      }
      return Promise.all(tasks).then(() => undefined)
    }

    this.setData({ regSubmitting: true, regErrorMsg: '' })
    this._updateCanRegister()
    wx.showLoading({ title: '注册登录中...', mask: true })

    postRegi(fullName)
      .then(async (firstRes: any) => {
        let res = firstRes
        let usedName = fullName
        // 兼容线上旧版 RegiMiniRequest (name min_length=2, max_length=5) 的 422 校验
        if (res.statusCode === 422 && (fullName.length < 2 || fullName.length > 5)) {
          usedName = fullName.length < 2 ? `${fullName}友` : fullName.slice(0, 5)
          res = await postRegi(usedName)
        }

        if (res.statusCode >= 200 && res.statusCode < 300 && res.data && res.data.id) {
          await syncPostRegisterFields(res.data.atoken, res.data.username || usedName)
          wx.hideLoading()
          this.setData({ regSubmitting: false })
          this._persistAuthSession({
            id: res.data.id,
            atoken: res.data.atoken,
            rtoken: res.data.rtoken,
            phone: res.data.phone || this.data.phoneNumber,
            username: fullName,
            role: res.data.role || '塾生',
            is_admin: res.data.is_admin,
            gender,
            email,
          })
          wx.showToast({ title: '注册成功', icon: 'success', duration: 1200 })
          setTimeout(() => {
            this._enterHomeAfterAuth()
          }, 400)
          return
        }

        wx.hideLoading()
        this.setData({ regSubmitting: false })
        this._updateCanRegister()

        const rawDetail = res.data?.detail
        const errMsg =
          typeof rawDetail === 'string'
            ? rawDetail
            : Array.isArray(rawDetail)
            ? rawDetail[0]?.msg || '输入信息格式有误，请检查后重试'
            : rawDetail?.message || res.data?.message || '注册失败，请重试'

        if (res.statusCode === 400 && (errMsg.includes('手机号无效') || errMsg.includes('过期'))) {
          if (_appLogin && typeof _appLogin.checkLoginStatus === 'function') {
            _appLogin.checkLoginStatus()
          }
          this.setData({
            hasPhoneNumber: false,
            regErrorMsg: '手机号授权已过期，请重新点击上方「一键授权」后再点注册并登录',
          })
          return
        }

        this.setData({ regErrorMsg: errMsg })
      })
      .catch(() => {
        wx.hideLoading()
        this.setData({
          regSubmitting: false,
          regErrorMsg: '网络异常，请稍后重试',
        })
        this._updateCanRegister()
      })
  },

  // ========== 手机号 + 密码登录方法 ==========

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
    const val = e.detail.value || ''
    this.setData({
      phoneInput: val,
      canDevLogin: val.length >= 10 && String(this.data.pwdInput || '').length >= 4,
    })
  },

  onPwdInput(e: any) {
    const val = e.detail.value || ''
    this.setData({
      pwdInput: val,
      canDevLogin: String(this.data.phoneInput || '').length >= 10 && val.length >= 4,
    })
  },

  loginByPassword() {
    if (!this.data.canDevLogin || this.data.submitting) return
    if (!this.data.privacyAgreed) {
      wx.showToast({
        title: '请先阅读并同意用户服务协议和隐私政策',
        icon: 'none',
        duration: 2500,
      })
      return
    }

    const { phoneInput: phone, pwdInput: password } = this.data
    this.setData({ submitting: true })
    wx.showLoading({ title: '登录中...', mask: true })

    wx.request({
      url: getBaseUrl() + '/api/users/token',
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: { phone, password },
      success: (res: any) => {
        wx.hideLoading()
        this.setData({ submitting: false })
        const data = res.data
        if (res.statusCode === 200 && data && data.id > 0) {
          this._persistAuthSession({
            id: data.id,
            atoken: data.atoken,
            rtoken: data.rtoken,
            phone: data.phone || phone,
            username: data.username || data.nickName || `用户${phone.slice(-4)}`,
            role: data.role || '',
            is_admin: data.is_admin,
            gender: data.gender,
            email: data.email,
          })
          wx.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => {
            this._enterHomeAfterAuth()
          }, 500)
        } else {
          wx.showToast({ title: data?.detail || data?.message || '手机号或密码错误', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        this.setData({ submitting: false })
        wx.showToast({ title: '网络错误', icon: 'none' })
      },
    })
  },

  enterAsGuest() {
    wx.setStorageSync('guestMode', true)
    wx.switchTab({ url: '/pages/aim/index' })
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
    } catch {
      wx.showToast({ title: '提交申请失败', icon: 'none' })
    } finally {
      this.setData({ submittingReset: false })
    }
  },

  // ========== 隐私政策相关方法 ==========

  togglePrivacyAgreement() {
    this.setData({
      privacyAgreed: !this.data.privacyAgreed,
    })
    this._updateCanRegister()
  },

  viewPrivacy() {
    wx.navigateTo({
      url: '/pages/privacy/index',
    })
  },

  viewAgreement() {
    wx.navigateTo({
      url: '/pages/agreement/index',
    })
  },
})
