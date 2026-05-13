// @ts-nocheck
import { changePass } from '../../services/user/user'

Page({
  data: {
    password: '',
    checkpass: '',
    errorMsg: '',
  },

  onPasswordInput(e: any) {
    this.setData({ password: e.detail.value, errorMsg: '' })
  },

  onCheckpassInput(e: any) {
    this.setData({ checkpass: e.detail.value, errorMsg: '' })
  },

  submitForm() {
    const { password, checkpass } = this.data

    // 前端验证
    if (!password) {
      this.setData({ errorMsg: '请输入新密码' })
      return
    }
    if (password.length < 6) {
      this.setData({ errorMsg: '密码应不少于6位' })
      return
    }
    if (!checkpass) {
      this.setData({ errorMsg: '请再次输入密码' })
      return
    }
    if (password !== checkpass) {
      this.setData({ errorMsg: '两次输入的密码不一致' })
      return
    }

    // 获取用户名
    const userInfo = wx.getStorageSync('userInfo') || {}
    const name = userInfo.name || userInfo.nickName || ''

    wx.showLoading({ title: '提交中...', mask: true })

    changePass({ name, newpass: password })
      .then((res: any) => {
        wx.hideLoading()
        if (res.code === 200) {
          wx.showToast({ title: '修改密码成功', icon: 'success' })
          this.setData({ password: '', checkpass: '', errorMsg: '' })
          setTimeout(() => wx.navigateBack(), 1500)
        } else {
          this.setData({ errorMsg: res.message || '修改密码失败' })
        }
      })
      .catch((err: any) => {
        wx.hideLoading()
        this.setData({ errorMsg: err.message || '修改密码失败，请稍后重试' })
      })
  },
})