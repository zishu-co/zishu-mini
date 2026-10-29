// @ts-nocheck
// pages/event/webview/index.ts
// 公众号文章 / 宣传链接 webview 容器
// spec: specs/port/archive/006-port-event-list.md
Page({
  data: {
    url: '',
    loadFailed: false,
  },

  onLoad(options: any) {
    const url = decodeURIComponent(options?.url || '') || 'https://zishu.co';
    this.setData({ url, loadFailed: false });
  },

  onShareAppMessage() {
    return {
      title: '🎉 自塾同城活动详情 · 邀你结伴参加！',
      path: '/pages/event/index',
    };
  },

  onWebviewError() {
    this.setData({ loadFailed: true });
  },

  onCopyUrl() {
    if (!this.data.url) return;
    wx.setClipboardData({
      data: this.data.url,
      success: () => {
        wx.showToast({ title: '📋 已复制链接，可在浏览器打开', icon: 'none' });
      },
    });
  },

  onGoPlaza() {
    wx.navigateTo({ url: '/pages/all/index' });
  },

  onGoBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/event/index' });
      },
    });
  },
});
