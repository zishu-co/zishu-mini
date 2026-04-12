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

  methods: {
    // 格式化日期
    formatDate(dateStr?: string): string {
      if (!dateStr) return '未设置';
      const date = new Date(dateStr);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${date.getFullYear()}-${month}-${day}`;
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
