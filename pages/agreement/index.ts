// pages/agreement/index.ts
Page({
  data: {
    contactEmail: 'service@zishu.co',
  },
  onLoad() {},
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
