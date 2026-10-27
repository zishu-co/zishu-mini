// @ts-nocheck
import base from '../../services/base'
const { get } = base

Page({
  data: {
    allData: [] as any[],
    listData: [] as any[],
    filteredList: [] as any[],
    searchKeyword: '',
    loading: true,
    showMine: false,
  },

  onLoad() {
    this.fetchData()
  },

  onPullDownRefresh() {
    this.fetchData().finally(() => wx.stopPullDownRefresh())
  },

  applyFilters(allData: any[], showMine: boolean, keyword: string) {
    let baseList = allData || []
    if (showMine) {
      const storedUserInfo = wx.getStorageSync('userInfo') || {}
      const userId = wx.getStorageSync('userId') || storedUserInfo.userId || storedUserInfo.id
      const userName = storedUserInfo.name || storedUserInfo.nickName || ''
      baseList = baseList.filter(
        (item: any) =>
          (userId && Number(item.taker_id) === Number(userId)) ||
          (userName && item.taker === userName)
      )
    }
    const kw = (keyword || '').trim().toLowerCase()
    if (!kw) return baseList
    return baseList.filter((item: any) => {
      const title = String(item.title || '').toLowerCase()
      const serial = String(item.task_serial || '').toLowerCase()
      const taker = String(item.taker || '').toLowerCase()
      const shushi = String(item.shushi || '').toLowerCase()
      return (
        title.indexOf(kw) !== -1 ||
        serial.indexOf(kw) !== -1 ||
        taker.indexOf(kw) !== -1 ||
        shushi.indexOf(kw) !== -1
      )
    })
  },

  onSearchInput(e: any) {
    const searchKeyword = e.detail.value || ''
    const listData = this.applyFilters(this.data.allData, this.data.showMine, searchKeyword)
    this.setData({ searchKeyword, listData, filteredList: listData })
  },

  clearSearch() {
    const listData = this.applyFilters(this.data.allData, this.data.showMine, '')
    this.setData({ searchKeyword: '', listData, filteredList: listData })
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
        const listData = this.applyFilters(allData, this.data.showMine, this.data.searchKeyword)
        this.setData({ allData, listData, filteredList: listData, loading: false })
      })
      .catch(() => {
        this.setData({ allData: [], listData: [], filteredList: [], loading: false })
      })
  },

  toggleFilter(e?: any) {
    const mode = e?.currentTarget?.dataset?.mode
    const showMine =
      mode === 'mine' ? true : mode === 'all' ? false : !this.data.showMine
    const listData = this.applyFilters(this.data.allData, showMine, this.data.searchKeyword)
    this.setData({ listData, filteredList: listData, showMine })
  },

  onProjectTap(e: any) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({
      url: `/pages/inno-detail/index?id=${id}`,
    })
  },
})