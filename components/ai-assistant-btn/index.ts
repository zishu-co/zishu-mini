// @ts-nocheck
// components/ai-assistant-btn/index.ts
// AI 助手悬浮按钮组件

Component({
  properties: {
    badge: {
      type: Boolean,
      value: false,
    },
    dot: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    isPressed: false,
  },

  methods: {
    onTouchStart() {
      this.setData({ isPressed: true });
    },

    onTouchEnd() {
      if (this.data.isPressed) {
        this.setData({ isPressed: false });
      }
    },

    onTap() {
      wx.navigateTo({
        url: '/pages/agent/index',
      });
    },

    onLongPress() {
      wx.showToast({
        title: '自塾 AI 助学助理',
        icon: 'none',
        duration: 1200,
      });
    },
  },
});
