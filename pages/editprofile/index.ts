// @ts-nocheck
import base, { getBaseUrl } from '../../services/base'
import { getProfile, submitProfile, deleteProfilePhoto } from '../../services/user/user'

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

const SOCIAL_TAG_PRESETS = [
  '#方舟小组共学',
  '#考研考公冲刺',
  '#AI与编程开发',
  '#英语听说突破',
  '#创业与产品实战',
  '#早起打卡监督',
]

const CITY_PRESETS = ['上海', '北京', '深圳', '杭州', '广州', '成都']

Page({
  data: {
    gender: '',
    avatarInitial: '塾',
    completenessPercent: 20,
    socialTagPresets: SOCIAL_TAG_PRESETS,
    socialTagItems: SOCIAL_TAG_PRESETS.map((t) => ({ text: t, active: false })),
    cityPresets: CITY_PRESETS,
    form: {
      name: '',
      gender: '',
      region: '',
      goal: '',
      desc: '',
    },
    profiles: [] as any[],
    uploadingPhoto: false,
    submitting: false,
    errorMsg: '',
  },

  onLoad() {
    this.fetchProfile()
  },

  onShareAppMessage() {
    const name = this.data.form?.name || '自塾学友'
    return {
      title: `👋 我是 ${name}，邀请你来学本领、上自塾！`,
      path: '/pages/learn/index',
    }
  },

  updatePreviewMeta(nextForm: any) {
    const meta = computeProfileMeta(nextForm)
    const descStr = String(nextForm.desc || '')
    const socialTagItems = SOCIAL_TAG_PRESETS.map((t) => ({
      text: t,
      active: descStr.indexOf(t) !== -1,
    }))
    this.setData({
      form: nextForm,
      gender: nextForm.gender || '',
      socialTagItems,
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
        const rawProfiles = Array.isArray(res?.profiles) ? res.profiles : []
        const profiles = rawProfiles.map((p: any) => ({
          ...p,
          _fullUrl: String(p.url || '').startsWith('http')
            ? p.url
            : `${getBaseUrl()}/${String(p.url || '').replace(/^\/+/, '')}`,
        }))
        this.setData({ profiles })
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

  onSelectCity(e: any) {
    const city = e.currentTarget.dataset.city
    if (!city) return
    this.updatePreviewMeta({ ...this.data.form, region: city })
  },

  onGoalInput(e: any) {
    this.updatePreviewMeta({ ...this.data.form, goal: e.detail.value })
  },

  onDescInput(e: any) {
    this.updatePreviewMeta({ ...this.data.form, desc: e.detail.value })
  },

  onToggleSocialTag(e: any) {
    const tag = e.currentTarget.dataset.tag
    if (!tag) return
    const currentDesc = String(this.data.form.desc || '').trim()
    let nextDesc = currentDesc
    if (currentDesc.includes(tag)) {
      nextDesc = currentDesc.replace(tag, '').replace(/\s{2,}/g, ' ').trim()
    } else {
      nextDesc = currentDesc ? `${currentDesc} ${tag}` : tag
    }
    this.updatePreviewMeta({ ...this.data.form, desc: nextDesc.slice(0, 500) })
  },

  // ── 109-edit-profile.md: 个人风采相册上传与删除 (/api/users/save_profile & /api/users/delete_profile) ──
  onChooseAndUploadPhoto() {
    if ((this.data.profiles || []).length >= 5) {
      wx.showToast({ title: '最多可上传 5 张风采照片', icon: 'none' })
      return
    }
    const userInfo = wx.getStorageSync('userInfo') || {}
    const userId = wx.getStorageSync('userId') || userInfo.userId || userInfo.id || 1
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || ''
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res: any) => {
        const tempPath = res?.tempFiles?.[0]?.tempFilePath
        if (!tempPath) return
        this.setData({ uploadingPhoto: true })
        wx.uploadFile({
          url: `${getBaseUrl()}/api/users/save_profile`,
          filePath: tempPath,
          name: 'file',
          formData: { id: String(userId) },
          header: { token, Authorization: token ? `Bearer ${token}` : '' },
          success: () => {
            wx.showToast({ title: '📸 照片已上传', icon: 'success' })
            this.fetchProfile()
          },
          fail: () => {
            wx.showToast({ title: '上传失败', icon: 'none' })
          },
          complete: () => {
            this.setData({ uploadingPhoto: false })
          },
        })
      },
    })
  },

  async onDeletePhoto(e: any) {
    const rawName = String(e.currentTarget.dataset.name || '').replace(/^api\//, '')
    if (!rawName) return
    try {
      await deleteProfilePhoto(rawName)
      wx.showToast({ title: '已移除该照片', icon: 'none' })
      this.fetchProfile()
    } catch (err) {
      wx.showToast({ title: '删除失败', icon: 'none' })
    }
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