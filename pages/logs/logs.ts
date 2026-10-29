// pages/logs/logs.ts
const util = require('../../utils/util')

Page({
  data: {
    logs: [] as { date: string; timeStamp: number }[],
    latestDate: '暂无记录',
  },
  onLoad() {
    this.loadLogs()
  },
  onShareAppMessage() {
    return {
      title: '学本领，上自塾 · 以终为始共学平台',
      path: '/pages/aim/index',
    }
  },
  loadLogs() {
    const stored = (wx.getStorageSync('logs') || []) as number[]
    const sourceLogs = stored.length > 0 ? stored : [Date.now()]
    const rawLogs = sourceLogs.map(log => ({
      date: util.formatTime(new Date(log)),
      timeStamp: log,
    }))
    this.setData({
      logs: rawLogs,
      latestDate: rawLogs[0]?.date || '暂无记录',
    })
  },
  onCopyLogs() {
    if (!this.data.logs.length) {
      wx.showToast({ title: '暂无日志可复制', icon: 'none' })
      return
    }
    const text = this.data.logs
      .slice(0, 20)
      .map((item, idx) => `#${idx + 1} ${item.date}`)
      .join('\n')
    wx.setClipboardData({
      data: `【自塾小程序诊断日志】\n共 ${this.data.logs.length} 条记录\n${text}`,
      success: () => {
        wx.showToast({ title: '📋 已复制诊断日志', icon: 'none' })
      },
    })
  },
  onClearLogs() {
    if (!this.data.logs.length) return
    wx.showModal({
      title: '清空日志',
      content: '确定清空本地启动与运行日志记录吗？',
      confirmColor: '#7c3aed',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync('logs', [])
          this.setData({ logs: [], latestDate: '暂无记录' })
          wx.showToast({ title: '已清空日志', icon: 'success' })
        }
      },
    })
  },
})
