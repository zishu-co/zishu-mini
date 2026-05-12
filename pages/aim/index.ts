// @ts-nocheck

// pages/aim/index.ts
// Toast 使用 require 方式导入
const Toast = require('tdesign-miniprogram/toast/index').default;
import http from '../../services/base';
import { isDevMode, isGuestMode } from '../../utils/env';

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

  // Dev 模式
  showDevBanner: boolean;
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

  showDevBanner: false,
});

Page<IAimPageData, IAimData>({
  data: getDefaultData(),

  onLoad() {
    // 初始化
  },

  onShow() {
    // 初始化 tabBar 高亮状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().init();
    }
    // 更新 Dev 模式提示条显示状态
    this.setData({
      showDevBanner: isDevMode() && isGuestMode()
    });
    this.init();
  },

  // 跳转到登录页
  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
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

  // 加载目标数据（使用真实后端接口）
  loadGoal() {
    this.setData({ goalLoading: true });

    // Dev 游客模式：直接返回 Mock 数据
    if (isDevMode() && isGuestMode()) {
      console.log('[Dev模式-游客] 使用 Mock 目标数据')
      setTimeout(() => {
        this.setData({
          currentGoal: mockGoal,
          goalLoading: false
        });
        wx.stopPullDownRefresh();
      }, 300);
      return;
    }

    // 从本地存储获取 userId
    const userInfo = wx.getStorageSync('userInfo') || {};
    const userId = userInfo.userId;
    const accessToken = wx.getStorageSync('accessToken');
    const refreshToken = wx.getStorageSync('refreshToken');

    console.log('[aim/loadGoal] 存储信息:', {
      hasUserId: !!userId,
      userId,
      hasAccessToken: !!accessToken,
      accessTokenLength: accessToken?.length || 0,
      hasRefreshToken: !!refreshToken,
      refreshTokenLength: refreshToken?.length || 0
    });

    if (!userId) {
      this.setData({
        currentGoal: null,
        goalLoading: false
      });
      wx.stopPullDownRefresh();
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请先登录',
        icon: 'info-circle',
        duration: 2000,
      });
      return;
    }

    // 发起真实请求
    console.log('[aim/loadGoal] 开始获取目标数据, userId:', userId);
    http.requestWithRefresh({
      url: `/api/users/fetch_goal/${userId}`,
      method: 'GET'
    }).then((res: any) => {
      console.log('[aim/loadGoal] 获取目标数据成功:', res);
      // 后端返回的是 goal_dict，可能是空对象
      const goal = res && Object.keys(res).length > 0 ? res : null;
      this.setData({
        currentGoal: goal,
        goalLoading: false
      });
      wx.stopPullDownRefresh();
    }).catch((err: any) => {
      console.error('[aim/loadGoal] 获取目标数据失败:', err);
      // 详细错误信息
      const errorMsg = err?.message || err?.errMsg || '未知错误';
      const errorCode = err?.code || '无错误码';
      const originalError = err?.originalError;

      console.error('[aim/loadGoal] 错误详情:', {
        message: errorMsg,
        code: errorCode,
        originalError,
        data: err?.data
      });

      this.setData({
        currentGoal: null,
        goalLoading: false
      });
      wx.stopPullDownRefresh();

      // 显示更详细的错误信息用于排查
      const displayMsg = `获取失败[${errorCode}]: ${errorMsg}`;
      Toast({
        context: this,
        selector: '#t-toast',
        message: displayMsg,
        icon: 'close-circle',
        duration: 3000,
      });
    });
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

    // 后端存储的进度是 0-10，每次加 1（对应显示增加 10%）
    const newProgress = Math.min(goal.process + 1, 10);
    
    this.setData({
      'currentGoal.process': newProgress
    });

    Toast({
      context: this,
      selector: '#t-toast',
      message: `进度已更新至 ${newProgress * 10}%`,
      icon: 'check-circle',
      duration: 1500,
    });

    // TODO: 实际项目中应该调用后端 API 更新
    // updateGoalProgress(goal.id, newProgress);
  },
});

interface IAimPageData extends IAimData {
  // 扩展
}
