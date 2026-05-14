// @ts-nocheck
// components/ai-assistant-btn/index.ts
// AI 助手悬浮按钮组件

Component({
  properties: {
    // 是否显示角标（表示有未读消息）
    badge: {
      type: Boolean,
      value: false,
    },
    // 是否显示红点
    dot: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    // 按钮动画状态
    isPressed: false,
  },

  lifetimes: {
    attached() {
      // 可扩展：从全局状态读取未读数
    },
  },

  methods: {
    onTap() {
      wx.navigateTo({
        url: '/pages/agent/index',
      });
    },

    onLongPress() {
      // 长按提示（可选）
      wx.showToast({
        title: 'AI 助理',
        icon: 'none',
        duration: 1000,
      });
    },
  },
});
