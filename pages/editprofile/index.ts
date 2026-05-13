// @ts-nocheck
import { getProfile, submitProfile } from '../../services/user/user'

Page({
  data: {
    form: {
      name: '',
      gender: '',
      region: '',
      desc: '',
    },
    errorMsg: '',
  },

  onLoad() {
    this.fetchProfile()
  },

  fetchProfile() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    const userId = userInfo.userId || 0

    wx.showLoading({ title: '加载中...', mask: true })

    getProfile({ userid: userId })
      .then((res: any) => {
        wx.hideLoading()
        if (res && res.name) {
          this.setData({
            form: {
              name: res.name || '',
              gender: res.gender || '',
              region: res.location || res.region || '',
              desc: res.desc || '',
            },
          })
        }
      })
      .catch(() => {
        wx.hideLoading()
      })
  },

  onNameInput(e: any) {
    this.setData({ 'form.name': e.detail.value, errorMsg: '' })
  },

  onGenderSelect(e: any) {
    this.setData({ 'form.gender': e.currentTarget.dataset.gender, errorMsg: '' })
  },

  onRegionInput(e: any) {
    this.setData({ 'form.region': e.detail.value, errorMsg: '' })
  },

  onDescInput(e: any) {
    this.setData({ 'form.desc': e.detail.value, errorMsg: '' })
  },

  submitForm() {
    const { name, gender, region, desc } = this.data.form

    if (!name) {
      this.setData({ errorMsg: '请输入名字' })
      return
    }

    const userInfo = wx.getStorageSync('userInfo') || {}
    const userId = userInfo.userId || 0

    const formData = {
      info: JSON.stringify({ name, gender, region, desc }),
    }

    wx.showLoading({ title: '保存中...', mask: true })

    submitProfile(formData)
      .then((res: any) => {
        wx.hideLoading()
        if (res.code === 200) {
          // 更新 storage 中的 userInfo
          const storedUserInfo = wx.getStorageSync('userInfo') || {}
          storedUserInfo.name = name
          storedUserInfo.nickName = name
          wx.setStorageSync('userInfo', storedUserInfo)

          wx.showToast({ title: '保存成功', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 1500)
        } else {
          this.setData({ errorMsg: res.message || '保存失败' })
        }
      })
      .catch(() => {
        wx.hideLoading()
        this.setData({ errorMsg: '保存失败，请稍后重试' })
      })
  },
})