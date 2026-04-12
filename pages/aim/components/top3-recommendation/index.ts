Component({
  properties: {
    recommendations: {
      type: Array,
      value: []
    },
    loading: {
      type: Boolean,
      value: false
    },
    refreshing: {
      type: Boolean,
      value: false
    },
    lastUpdated: {
      type: String,
      value: ''
    }
  },

  methods: {
    // 获取类型图标
    getTypeIcon(type: string): string {
      const iconMap: Record<string, string> = {
        'COURSE_URGENT': 'book-open',
        'COURSE_POPULAR': 'book',
        'TASK_CLAIM': 'task',
        'GOAL_TALK': 'chat',
        'REPORT_TIME': 'document',
        'PROFILE_COMPLETE': 'user',
        'EXAM_PUBLISH': 'edit',
        'COURSE_PUBLISH': 'video'
      };
      return iconMap[type] || 'list';
    },

    // 获取类型图标样式类
    getTypeIconClass(type: string): string {
      const classMap: Record<string, string> = {
        'COURSE_URGENT': 'course-icon',
        'COURSE_POPULAR': 'course-icon',
        'TASK_CLAIM': 'task-icon',
        'GOAL_TALK': 'goal-icon',
        'REPORT_TIME': 'report-icon',
        'PROFILE_COMPLETE': 'profile-icon'
      };
      return classMap[type] || 'default-icon';
    },

    // 获取紧急度文本
    getUrgencyText(level?: string): string {
      const textMap: Record<string, string> = {
        'critical': '紧急',
        'high': '高',
        'medium': '中',
        'low': '低'
      };
      return textMap[level || 'low'] || '低';
    },

    // 格式化截止时间
    formatDeadline(deadline: string): string {
      const date = new Date(deadline);
      const now = new Date();
      const diffMs = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return '今天截止';
      if (diffDays === 1) return '明天截止';
      if (diffDays > 0) return `${diffDays}天后截止`;
      return '已逾期';
    },

    // 刷新推荐
    onRefresh() {
      this.triggerEvent('refresh');
    },

    // 显示算法说明
    showAlgorithmInfo() {
      wx.showModal({
        title: '推荐算法说明',
        content: '推荐算法基于以下维度综合评分：\n\n• 时间紧迫度 (35%)：距离截止时间越近，优先级越高\n• 重要程度 (30%)：任务的重要性和影响范围\n• 个人匹配度 (25%)：基于您的技能和兴趣\n• 成长价值 (10%)：对个人发展的帮助',
        showCancel: false,
        confirmText: '知道了'
      });
    },

    // 点击推荐项
    onItemTap(e: any) {
      const { item } = e.currentTarget.dataset;
      this.triggerEvent('itemtap', { item });
    },

    // 点击操作按钮
    onActionTap(e: any) {
      const { item } = e.currentTarget.dataset;
      this.triggerEvent('actiontap', { item });
    }
  }
});
