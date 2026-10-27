// @ts-nocheck
import { fetchShuzhi } from '../../services/user/user'

function computeLevelInfo(balance: number) {
  const b = Math.max(0, Number(balance) || 0)
  if (b >= 500) {
    return {
      levelTitle: '👑 自塾宗师',
      levelProgress: 100,
      levelNextHint: '已达最高荣誉段位',
    }
  }
  if (b >= 200) {
    return {
      levelTitle: '🔥 破局达人',
      levelProgress: Math.min(100, Math.round(((b - 200) / 300) * 100)),
      levelNextHint: `距离「👑 自塾宗师」还需 ${500 - b} 塾值`,
    }
  }
  if (b >= 50) {
    return {
      levelTitle: '⚡ 进阶行者',
      levelProgress: Math.min(100, Math.round(((b - 50) / 150) * 100)),
      levelNextHint: `距离「🔥 破局达人」还需 ${200 - b} 塾值`,
    }
  }
  return {
    levelTitle: '🌱 初心学徒',
    levelProgress: Math.min(100, Math.round((b / 50) * 100)),
    levelNextHint: `距离「⚡ 进阶行者」还需 ${50 - b} 塾值`,
  }
}

Page({
  data: {
    list: [] as any[],
    listData: [] as any[],
    filteredList: [] as any[],
    activeTab: 'all',
    totalAmount: 0,
    totalAmountStr: '+0',
    currentBalance: 0,
    levelTitle: '🌱 初心学徒',
    levelProgress: 0,
    levelNextHint: '距离「⚡ 进阶行者」还需 50 塾值',
    loading: true,
  },

  onLoad() {
    this.fetchData()
  },

  applyTabFilter(list: any[], tab: string) {
    if (tab === 'income') {
      return list.filter((item: any) => !item._isNeg)
    }
    if (tab === 'expense') {
      return list.filter((item: any) => item._isNeg)
    }
    return list
  },

  switchTab(e: any) {
    const activeTab = e.currentTarget.dataset.tab || 'all'
    const filteredList = this.applyTabFilter(this.data.list, activeTab)
    this.setData({ activeTab, filteredList })
  },

  fetchData() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    const userId = wx.getStorageSync('userId') || userInfo.userId || userInfo.id || 0

    wx.showLoading({ title: '加载中...', mask: true })

    fetchShuzhi(userId)
      .then((res: any) => {
        wx.hideLoading()
        if (Array.isArray(res)) {
          const list = res.map((item: any) => {
            const amt = Number(item.amount) || 0
            return {
              ...item,
              amount: amt,
              _amountStr: amt >= 0 ? '+' + amt : String(amt),
              _isNeg: amt < 0,
            }
          })
          const totalAmount = list.reduce(
            (acc: number, item: any) => acc + (Number(item.amount) || 0),
            0
          )
          const totalAmountStr = totalAmount >= 0 ? '+' + totalAmount : String(totalAmount)
          const currentBalance = list[0]?.balance ?? 0
          const levelInfo = computeLevelInfo(currentBalance)
          const filteredList = this.applyTabFilter(list, this.data.activeTab)
          this.setData({
            list,
            listData: list,
            filteredList,
            totalAmount,
            totalAmountStr,
            currentBalance,
            ...levelInfo,
            loading: false,
          })
        } else {
          const levelInfo = computeLevelInfo(0)
          this.setData({
            list: [],
            listData: [],
            filteredList: [],
            totalAmount: 0,
            totalAmountStr: '+0',
            currentBalance: 0,
            ...levelInfo,
            loading: false,
          })
        }
      })
      .catch(() => {
        wx.hideLoading()
        const levelInfo = computeLevelInfo(0)
        this.setData({
          list: [],
          listData: [],
          filteredList: [],
          totalAmount: 0,
          totalAmountStr: '+0',
          currentBalance: 0,
          ...levelInfo,
          loading: false,
        })
      })
  },
})