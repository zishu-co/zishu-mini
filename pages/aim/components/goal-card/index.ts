Component({
  properties: {
    goal: {
      type: Object,
      value: null
    },
    loading: {
      type: Boolean,
      value: false
    }
  },

  data: {
    steps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },

  methods: {
    // 格式化日期
    formatDate(dateStr?: string): string {
      if (!dateStr) return '未设置';
      const date = new Date(dateStr);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${date.getFullYear()}-${month}-${day}`;
    },

    // 复制目标内容
    onCopyGoal() {
      const goal: any = this.data.goal;
      if (!goal || !goal.content) return;
      const text = `🎯【我的自塾阶段目标】\n${goal.content}${goal.review ? '\n💡 复盘寄语：' + goal.review : ''}`;
      wx.setClipboardData({
        data: text,
        success: () => {
          wx.showToast({ title: '📋 已复制阶段目标', icon: 'none' });
        }
      });
    },

    // 编辑目标
    onEdit() {
      this.triggerEvent('edit');
    },

    // 创建目标
    onCreate() {
      this.triggerEvent('create');
    },

    // 更新进度
    onUpdateProgress() {
      this.triggerEvent('updateProgress');
    }
  }
});
