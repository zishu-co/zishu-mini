// @ts-nocheck
import { getProfile, submitProfile } from '../../services/user/user'

Page({
  data: {
    gender: '',
    form: {
      name: '',
      gender: '',
      region: '',
      desc: '',
    },
    submitting: false,
    errorMsg: '',
  },

  onLoad() {
    this.fetchProfile()
  },

  fetchProfile() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    const userId = wx.getStorageSync('userId') || userInfo.userId || userInfo.id || 0

    wx.showLoading({ title: '加载中...', mask: true })

    getProfile({ userid: userId })
      .then((res: any) => {
        wx.hideLoading()
        if (res && (res.name || res.gender || res.location || res.region || res.desc)) {
          const gender = res.gender || userInfo.gender || ''
          this.setData({
            gender,
            form: {
              name: res.name || userInfo.name || userInfo.nickName || '',
              gender,
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
    const gender = e.currentTarget.dataset.gender
    this.setData({ gender, 'form.gender': gender, errorMsg: '' })
  },

  onRegionInput(e: any) {
    this.setData({ 'form.region': e.detail.value, errorMsg: '' })
  },

  onDescInput(e: any) {
    this.setData({ 'form.desc': e.detail.value, errorMsg: '' })
  },

  submitForm() {
    if (this.data.submitting) return

    const { name, region, desc } = this.data.form
    const gender = this.data.gender || this.data.form.gender

    if (!name || !name.trim()) {
      this.setData({ errorMsg: '请输入名字' })
      return
    }

    const formData = {
      info: JSON.stringify({ name: name.trim(), gender, region, desc }),
    }

    this.setData({ submitting: true, errorMsg: '' })
    wx.showLoading({ title: '保存中...', mask: true })

    submitProfile(formData)
      .then((res: any) => {
        wx.hideLoading()
        if (res && res.code === 200) {
          // 更新 storage 中的 userInfo 并同步 globalData
          const storedUserInfo = wx.getStorageSync('userInfo') || {}
          storedUserInfo.name = name.trim()
          storedUserInfo.nickName = name.trim()
          storedUserInfo.gender = this.data.gender || gender
          storedUserInfo.region = region
          storedUserInfo.desc = desc
          wx.setStorageSync('userInfo', storedUserInfo)

          const appInstance = getApp<any>()
          if (appInstance && appInstance.globalData) {
            appInstance.globalData.userInfo = storedUserInfo
          }

          wx.showToast({ title: '保存成功', icon: 'success' })
          setTimeout(() => wx.navigateBack(), 1500)
        } else {
          this.setData({ errorMsg: res?.message || '保存失败' })
        }
      })
      .catch(() => {
        wx.hideLoading()
        this.setData({ errorMsg: '保存失败，请稍后重试' })
      })
      .finally(() => {
        this.setData({ submitting: false })
      })
  },
})