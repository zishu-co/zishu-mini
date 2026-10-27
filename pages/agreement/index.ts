// pages/agreement/index.ts
Page({
  data: {
    contactEmail: 'service@zishu.co',
  },
  onLoad() {},
  onShareAppMessage() {
    return {
      title: '自塾用户服务协议 · 以终为始共学平台',
      path: '/pages/agreement/index',
    };
  },
  onCopyEmail() {
    wx.setClipboardData({
      data: this.data.contactEmail,
      success: () => {
        wx.showToast({ title: '📋 已复制官方联系邮箱', icon: 'none' });
      },
    });
  },
  onConfirmBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/my/my' });
      },
    });
  },
});
