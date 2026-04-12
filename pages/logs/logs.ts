// pages/logs/logs.ts
const util = require('../../utils/util')

Page({
  data: {
    logs: [] as { date: string; timeStamp: number }[]
  },
  onLoad() {
    this.setData({
      logs: ((wx.getStorageSync('logs') || []) as number[]).map(log => {
        return {
          date: util.formatTime(new Date(log)),
          timeStamp: log
        }
      })
    })
  }
})
