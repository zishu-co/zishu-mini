// @ts-nocheck
// pages/event/webview/index.ts
// 公众号文章 / 宣传链接 webview 容器
// spec: specs/port/archive/006-port-event-list.md
Page({
  data: {
    url: '',
  },

  onLoad(options: any) {
    const url = decodeURIComponent(options?.url || '');
    if (!url) {
      wx.showToast({ title: '链接无效', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
      return;
    }
    this.setData({ url });
  },
});
