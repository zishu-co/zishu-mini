// pages/privacy/index.ts
Page({
  data: {
    contactEmail: 'service@zishu.co',
  },
  onLoad() {},
  onShareAppMessage() {
    return {
      title: '自塾隐私政策与安全合规承诺',
      path: '/pages/privacy/index',
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
