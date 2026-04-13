// pages/aim/index.ts
// Toast 使用 require 方式导入
const Toast = require('tdesign-miniprogram/toast/index').default;

// 推荐项接口
interface RecommendationItem {
  id: string;
  type: string;
  title: string;
  description: string;
  action_text: string;
  action_url: string;
  score: number;
  urgency_level: string;
  estimated_time: string;
  deadline?: string;
  reasons: string[];
}

// 目标接口
interface Goal {
  id: number;
  user_id: number;
  content: string;
  start_time?: string;
  deadline?: string;
  process: number;
  end_time?: string;
  review?: string;
}

// Mock 数据
const mockRecommendations: RecommendationItem[] = [
  {
    id: '1',
    type: 'COURSE_URGENT',
    title: '完成第三章学习笔记',
    description: '整理课程中关于需求分析的重点内容，补充到学习笔记中',
    action_text: '去学习',
    action_url: '/pages/inno/index',
    score: 92,
    urgency_level: 'high',
    estimated_time: '45分钟',
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    reasons: ['与你的目标高度相关', '明天是软考日']
  },
  {
    id: '2',
    type: 'TASK_CLAIM',
    title: '回复邮件：项目进度汇报',
    description: '周报需要更新本周的项目进度，包括已完成的任务和下周计划',
    action_text: '处理',
    action_url: '/pages/event/index',
    score: 85,
    urgency_level: 'medium',
    estimated_time: '20分钟',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    reasons: ['邮件已等待3天']
  },
  {
    id: '3',
    type: 'GOAL_TALK',
    title: '周目标回顾与调整',
    description: '本周目标进度回顾，评估是否需要调整下周计划',
    action_text: '开始复盘',
    action_url: '/pages/aim/index',
    score: 78,
    urgency_level: 'low',
    estimated_time: '30分钟',
    reasons: ['周总结有助于目标达成']
  }
];

const mockGoal: Goal = {
  id: 1,
  user_id: 1001,
  content: '通过软考高级（系统架构设计师）考试\n\n具体要求：\n1. 完成教材通读\n2. 完成历年真题练习\n3. 整理错题本',
  start_time: '2026-03-01',
  deadline: '2026-05-24',
  process: 65,
  review: '已完成第一轮教材学习，目前在做历年真题。\n\n进度：\n- 教材完成度：100%\n- 真题完成度：60%\n- 错题整理：30%\n\n下周计划：完成2019-2021年真题'
};

interface IAimData {
  // 推荐数据
  recommendations: RecommendationItem[];
  recommendationLoading: boolean;
  recommendationRefreshing: boolean;
  lastUpdated: string;

  // 目标数据
  currentGoal: Goal | null;
  goalLoading: boolean;
}

// 格式化更新时间
const formatTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getDefaultData = (): IAimData => ({
  recommendations: [],
  recommendationLoading: false,
  recommendationRefreshing: false,
  lastUpdated: '',

  currentGoal: null,
  goalLoading: false,
});

Page<IData, IAimData>({
  data: getDefaultData(),

  onLoad() {
    // 初始化
  },

  onShow() {
    // 初始化 tabBar 高亮状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().init();
    }
    this.init();
  },

  onPullDownRefresh() {
    this.init();
  },

  init() {
    this.loadRecommendations();
    this.loadGoal();
  },

  // 加载推荐数据（使用 Mock）
  loadRecommendations() {
    this.setData({ recommendationLoading: true });
    
    // 模拟 API 延迟
    setTimeout(() => {
      this.setData({
        recommendations: mockRecommendations,
        recommendationLoading: false,
        lastUpdated: formatTime()
      });
    }, 500);
  },

  // 加载目标数据（使用 Mock）
  loadGoal() {
    this.setData({ goalLoading: true });
    
    // 模拟 API 延迟
    setTimeout(() => {
      this.setData({
        currentGoal: mockGoal,
        goalLoading: false
      });
      wx.stopPullDownRefresh();
    }, 300);
  },

  // 刷新推荐
  onRefreshRecommendation() {
    this.setData({ recommendationRefreshing: true });
    
    // 模拟刷新
    setTimeout(() => {
      this.setData({
        recommendationRefreshing: false,
        lastUpdated: formatTime()
      });
      Toast({
        context: this,
        selector: '#t-toast',
        message: '推荐已刷新',
        icon: 'check-circle',
        duration: 1500,
      });
    }, 800);
  },

  // 推荐项点击
  onRecommendationItemTap(e: any) {
    const { item } = e.detail;
    console.log('推荐项点击:', item);
  },

  // 推荐操作按钮点击
  onRecommendationActionTap(e: any) {
    const { item } = e.detail;
    
    // 根据 action_url 跳转
    if (item.action_url) {
      // 内部页面跳转
      if (item.action_url.startsWith('/')) {
        wx.navigateTo({ url: item.action_url });
      } else {
        // 外部链接或其他处理
        Toast({
          context: this,
          selector: '#t-toast',
          message: `跳转至: ${item.title}`,
          icon: '',
          duration: 1500,
        });
      }
    }
  },

  // 编辑目标
  onEditGoal() {
    Toast({
      context: this,
      selector: '#t-toast',
      message: '编辑目标功能待开发',
      icon: 'info-circle',
      duration: 2000,
    });
  },

  // 创建目标
  onCreateGoal() {
    Toast({
      context: this,
      selector: '#t-toast',
      message: '创建目标功能待开发',
      icon: 'info-circle',
      duration: 2000,
    });
  },

  // 更新进度
  onUpdateProgress() {
    // 简单的进度更新逻辑
    const goal = this.data.currentGoal;
    if (!goal) return;

    const newProgress = Math.min(goal.process + 10, 100);
    
    this.setData({
      'currentGoal.process': newProgress
    });

    Toast({
      context: this,
      selector: '#t-toast',
      message: `进度已更新至 ${newProgress}%`,
      icon: 'check-circle',
      duration: 1500,
    });

    // TODO: 实际项目中应该调用后端 API 更新
    // updateGoalProgress(goal.id, newProgress);
  },
});

interface IData extends IAimData {
  // 扩展
}
