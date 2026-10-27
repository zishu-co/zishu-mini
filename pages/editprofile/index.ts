// @ts-nocheck
import { getProfile, submitProfile } from '../../services/user/user'

function computeProfileMeta(form: any) {
  const name = (form?.name || '').trim()
  const gender = (form?.gender || '').trim()
  const region = (form?.region || '').trim()
  const goal = (form?.goal || '').trim()
  const desc = (form?.desc || '').trim()

  const filledCount = [name, gender, region, goal, desc].filter(Boolean).length
  const completenessPercent = Math.round((filledCount * 100) / 5)
  const avatarInitial = name ? name.charAt(0) : '塾'
  return {
    avatarInitial,
    completenessPercent,
  }
}

Page({
  data: {
    gender: '',
    avatarInitial: '塾',
    completenessPercent: 20,
    form: {
      name: '',
      gender: '',
      region: '',
      goal: '',
      desc: '',
    },
    submitting: false,
    errorMsg: '',
  },

  onLoad() {
    this.fetchProfile()
  },

  updatePreviewMeta(nextForm: any) {
    const meta = computeProfileMeta(nextForm)
    this.setData({
      form: nextForm,
      gender: nextForm.gender || '',
      ...meta,
      errorMsg: '',
    })
  },

  fetchProfile() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    const userId = wx.getStorageSync('userId') || userInfo.userId || userInfo.id || 0

    wx.showLoading({ title: '加载中...', mask: true })

    getProfile({ userid: userId })
      .then((res: any) => {
        wx.hideLoading()
        const nextForm = {
          name: res?.name || userInfo.name || userInfo.nickName || '',
          gender: res?.gender || userInfo.gender || '',
          region: res?.location || res?.region || userInfo.region || '',
          goal: res?.goal || userInfo.goal || '',
          desc: res?.desc || userInfo.desc || '',
        }
        this.updatePreviewMeta(nextForm)
      })
      .catch(() => {
        wx.hideLoading()
        const nextForm = {
          name: userInfo.name || userInfo.nickName || '',
          gender: userInfo.gender || '',
          region: userInfo.region || '',
          goal: userInfo.goal || '',
          desc: userInfo.desc || '',
        }
        this.updatePreviewMeta(nextForm)
      })
  },

  onNameInput(e: any) {
    this.updatePreviewMeta({ ...this.data.form, name: e.detail.value })
  },

  onGenderSelect(e: any) {
    const gender = e.currentTarget.dataset.gender
    this.updatePreviewMeta({ ...this.data.form, gender })
  },

  onRegionInput(e: any) {
    this.updatePreviewMeta({ ...this.data.form, region: e.detail.value })
  },

  onGoalInput(e: any) {
    this.updatePreviewMeta({ ...this.data.form, goal: e.detail.value })
  },

  onDescInput(e: any) {
    this.updatePreviewMeta({ ...this.data.form, desc: e.detail.value })
  },

  submitForm() {
    if (this.data.submitting) return

    const { name, region, goal, desc } = this.data.form
    const gender = this.data.gender || this.data.form.gender

    if (!name || !name.trim()) {
      this.setData({ errorMsg: '请输入名字' })
      return
    }

    const formData = {
      info: JSON.stringify({ name: name.trim(), gender, region, goal, desc }),
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
          storedUserInfo.goal = goal
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