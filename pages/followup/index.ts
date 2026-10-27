// @ts-nocheck
import base from '../../services/base'
const { get } = base

Page({
  data: {
    allData: [] as any[],
    listData: [] as any[],
    loading: true,
    showMine: false,
  },

  onLoad() {
    this.fetchData()
  },

  onPullDownRefresh() {
    this.fetchData().finally(() => wx.stopPullDownRefresh())
  },

  fetchData() {
    this.setData({ loading: true })
    return get('/api/inno/fetch_finished_projects')
      .then((res: any) => {
        const raw = Array.isArray(res) ? res : []
        const allData = raw.map((item: any) => ({
          ...item,
          _startDate: item.start_date ? String(item.start_date).slice(0, 10) : '-',
          _deadline: item.deadline ? String(item.deadline).slice(0, 10) : '-',
          _finishDate: item.finish_date ? String(item.finish_date).slice(0, 10) : '',
        }))
        this.setData({ allData, listData: allData, loading: false })
      })
      .catch(() => {
        this.setData({ allData: [], listData: [], loading: false })
      })
  },

  toggleFilter(e?: any) {
    const mode = e?.currentTarget?.dataset?.mode
    const showMine =
      mode === 'mine' ? true : mode === 'all' ? false : !this.data.showMine
    if (showMine) {
      const storedUserInfo = wx.getStorageSync('userInfo') || {}
      const userId = wx.getStorageSync('userId') || storedUserInfo.userId || storedUserInfo.id
      const userName = storedUserInfo.name || storedUserInfo.nickName || ''
      const filtered = this.data.allData.filter(
        (item: any) =>
          (userId && Number(item.taker_id) === Number(userId)) ||
          (userName && item.taker === userName)
      )
      this.setData({ listData: filtered, showMine })
    } else {
      this.setData({ listData: this.data.allData, showMine })
    }
  },

  onProjectTap(e: any) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({
      url: `/pages/inno-detail/index?id=${id}`,
    })
  },
})