// @ts-nocheck
import { fetchShuzhi } from '../../services/user/user'

Page({
  data: {
    list: [] as any[],
    listData: [] as any[],
    totalAmount: 0,
    totalAmountStr: '+0',
    currentBalance: 0,
    loading: true,
  },

  onLoad() {
    this.fetchData()
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
          this.setData({
            list,
            listData: list,
            totalAmount,
            totalAmountStr,
            currentBalance,
            loading: false,
          })
        } else {
          this.setData({
            list: [],
            listData: [],
            totalAmount: 0,
            totalAmountStr: '+0',
            currentBalance: 0,
            loading: false,
          })
        }
      })
      .catch(() => {
        wx.hideLoading()
        this.setData({
          list: [],
          listData: [],
          totalAmount: 0,
          totalAmountStr: '+0',
          currentBalance: 0,
          loading: false,
        })
      })
  },
})