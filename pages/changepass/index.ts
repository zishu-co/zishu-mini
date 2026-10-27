// @ts-nocheck
import { changePass } from '../../services/user/user'

function evaluateStrength(pwd: string) {
  const s = (pwd || '').trim()
  if (!s) {
    return {
      strengthLevel: '',
      strengthClass: '',
      strengthPercent: 0,
    }
  }
  let score = 0
  if (s.length >= 6) score += 1
  if (s.length >= 10) score += 1
  if (/[0-9]/.test(s) && /[a-zA-Z]/.test(s)) score += 1
  if (/[^a-zA-Z0-9]/.test(s)) score += 1

  if (score >= 3) {
    return {
      strengthLevel: '强',
      strengthClass: 'strong',
      strengthPercent: 100,
    }
  }
  if (score >= 2) {
    return {
      strengthLevel: '中',
      strengthClass: 'medium',
      strengthPercent: 66,
    }
  }
  return {
    strengthLevel: '弱',
    strengthClass: 'weak',
    strengthPercent: 33,
  }
}

Page({
  data: {
    name: '',
    oldPass: '',
    newPass: '',
    confirmPass: '',
    password: '',
    checkpass: '',
    showOld: false,
    showNew: false,
    showConfirm: false,
    strengthLevel: '',
    strengthClass: '',
    strengthPercent: 0,
    matchStatus: '', // '' | 'match' | 'mismatch'
    submitting: false,
    errorMsg: '',
  },

  onLoad() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    const name = userInfo.name || userInfo.nickName || userInfo.username || ''
    if (name) {
      this.setData({ name })
    }
  },

  onShareAppMessage() {
    return {
      title: '学本领，上自塾 · 以终为始，结伴共学',
      path: '/pages/aim/index',
    }
  },

  toggleShowOld() {
    this.setData({ showOld: !this.data.showOld })
  },

  toggleShowNew() {
    this.setData({ showNew: !this.data.showNew })
  },

  toggleShowConfirm() {
    this.setData({ showConfirm: !this.data.showConfirm })
  },

  onNameInput(e: any) {
    this.setData({ name: e.detail.value, errorMsg: '' })
  },

  onOldPassInput(e: any) {
    this.setData({ oldPass: e.detail.value, errorMsg: '' })
  },

  onPasswordInput(e: any) {
    const val = e.detail.value
    const strength = evaluateStrength(val)
    const confirm = this.data.confirmPass
    const matchStatus = !confirm ? '' : val === confirm ? 'match' : 'mismatch'
    this.setData({
      newPass: val,
      password: val,
      ...strength,
      matchStatus,
      errorMsg: '',
    })
  },

  onCheckpassInput(e: any) {
    const val = e.detail.value
    const newPass = this.data.newPass
    const matchStatus = !val ? '' : val === newPass ? 'match' : 'mismatch'
    this.setData({ confirmPass: val, checkpass: val, matchStatus, errorMsg: '' })
  },

  onGenerateStrongPass() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
    let pwd = 'Zs!'
    for (let i = 0; i < 7; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    const strength = evaluateStrength(pwd)
    this.setData({
      newPass: pwd,
      password: pwd,
      confirmPass: pwd,
      checkpass: pwd,
      showNew: true,
      showConfirm: true,
      matchStatus: 'match',
      ...strength,
      errorMsg: '',
    })
    wx.setClipboardData({
      data: pwd,
      success: () => {
        wx.showToast({ title: '🎲 已生成并复制高强密码', icon: 'none' })
      },
    })
  },

  submitForm() {
    if (this.data.submitting) return

    const userInfo = wx.getStorageSync('userInfo') || {}
    const name = (this.data.name || userInfo.name || userInfo.nickName || userInfo.username || '').trim()
    const oldPass = (this.data.oldPass || '').trim()
    const newPass = (this.data.newPass || this.data.password || '').trim()
    const confirmPass = (this.data.confirmPass || this.data.checkpass || '').trim()

    // 前端非空与一致性验证
    if (!name) {
      this.setData({ errorMsg: '请输入用户名' })
      return
    }
    if (!oldPass) {
      this.setData({ errorMsg: '请输入当前密码' })
      return
    }
    if (!newPass) {
      this.setData({ errorMsg: '请输入新密码' })
      return
    }
    if (newPass.length < 6) {
      this.setData({ errorMsg: '新密码应不少于6位' })
      return
    }
    if (!confirmPass) {
      this.setData({ errorMsg: '请再次输入新密码' })
      return
    }
    if (newPass !== confirmPass) {
      this.setData({ errorMsg: '两次输入的新密码不一致' })
      return
    }

    this.setData({ submitting: true, errorMsg: '' })
    wx.showLoading({ title: '提交中...', mask: true })

    changePass({ name, newpass: newPass })
      .then((res: any) => {
        wx.hideLoading()
        if (res && res.code === 200) {
          wx.showToast({ title: '修改密码成功', icon: 'success' })
          this.setData({
            oldPass: '',
            newPass: '',
            confirmPass: '',
            password: '',
            checkpass: '',
            strengthLevel: '',
            strengthClass: '',
            strengthPercent: 0,
            errorMsg: '',
          })
          setTimeout(() => wx.navigateBack(), 1500)
        } else {
          this.setData({ errorMsg: res?.message || '修改密码失败' })
        }
      })
      .catch((err: any) => {
        wx.hideLoading()
        this.setData({ errorMsg: err?.message || '修改密码失败，请稍后重试' })
      })
      .finally(() => {
        this.setData({ submitting: false })
      })
  },
})