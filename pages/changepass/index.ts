// @ts-nocheck
import { changePass } from '../../services/user/user'

Page({
  data: {
    name: '',
    oldPass: '',
    newPass: '',
    confirmPass: '',
    password: '',
    checkpass: '',
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

  onNameInput(e: any) {
    this.setData({ name: e.detail.value, errorMsg: '' })
  },

  onOldPassInput(e: any) {
    this.setData({ oldPass: e.detail.value, errorMsg: '' })
  },

  onPasswordInput(e: any) {
    const val = e.detail.value
    this.setData({ newPass: val, password: val, errorMsg: '' })
  },

  onCheckpassInput(e: any) {
    const val = e.detail.value
    this.setData({ confirmPass: val, checkpass: val, errorMsg: '' })
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