// @ts-nocheck

// pages/aim/index.ts
const Toast = require('tdesign-miniprogram/toast/index').default;
import http from '../../services/base';
import { isDevMode, isGuestMode } from '../../utils/env';

interface RecommendationItem {
  id: string;
  action_id?: number;
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

const fallbackRecommendations: RecommendationItem[] = [
  {
    id: 'rec-ark',
    type: 'COURSE_URGENT',
    title: '加入 2男2女「诺亚方舟」共学搭子舱',
    description: '选定一门技能好课，与 3 位同频男女学伴结成方舟，一起开三会、拿满分结课证书',
    action_text: '找搭子选课',
    action_url: '/pages/learn/index',
    score: 95,
    urgency_level: 'high',
    estimated_time: '25分钟',
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    reasons: ['2男2女黄金搭子机制', '共学通关率提升 300%'],
  },
  {
    id: 'rec-plaza',
    type: 'GOAL_TALK',
    title: '去同路人广场邂逅学伴 & 发起 15 分钟破冰约聊',
    description: '查看全塾 7 日学霸热力榜与领航塾师，一键预约目标面谈或共学打卡',
    action_text: '去逛广场',
    action_url: '/pages/all/index',
    score: 89,
    urgency_level: 'medium',
    estimated_time: '15分钟',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    reasons: ['找到同目标学习搭子', '1v1 目标面谈赋能'],
  },
  {
    id: 'rec-inno',
    type: 'TASK_CLAIM',
    title: '揭榜创新实战任务 · 赚取高额塾值悬赏',
    description: '在实战项目中与优秀同伴协作交付，快速晋升「荣耀学霸」与「领航塾师」段位',
    action_text: '去揭榜',
    action_url: '/pages/inno/index',
    score: 84,
    urgency_level: 'low',
    estimated_time: '45分钟',
    reasons: ['高额塾值奖励', '段位快速晋升'],
  },
];

const mockGoal: Goal = {
  id: 1,
  user_id: 1001,
  content: '通过软考高级（系统架构设计师）考试并结识 3 位技术共学搭子\n\n关键里程碑：\n1. 完成核心章节学习并组方舟通关\n2. 完成历年真题闯关测验\n3. 每周与塾师/学伴完成 1 次目标复盘面谈',
  start_time: '2026-10-01',
  deadline: '2026-12-31',
  process: 6,
  review: '已完成第一轮教材精读，加入方舟与 3 位同伴结伴打卡中，本周冲刺真题满分！',
};

const TAB_BAR_PAGES = [
  '/pages/learn/index',
  '/pages/inno/index',
  '/pages/aim/index',
  '/pages/event/index',
  '/pages/my/my',
];

interface GoalForm {
  content: string;
  deadline: string;
  process: string;
  review: string;
}

interface IAimData {
  recommendations: RecommendationItem[];
  recommendationLoading: boolean;
  recommendationRefreshing: boolean;
  lastUpdated: string;

  currentGoal: Goal | null;
  goalLoading: boolean;
  goalSaving: boolean;

  // 趣味成长激励看板数据
  goalProgressPercent: number;
  energyLevelText: string;
  energyBadge: string;
  streakDays: number;

  showGoalModal: boolean;
  isEditingGoal: boolean;
  goalForm: GoalForm;

  showDevBanner: boolean;
}

const formatTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getTodayDateStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const computeEnergyMeta = (goal: Goal | null) => {
  if (!goal) {
    return {
      goalProgressPercent: 0,
      energyLevelText: '🌱 立下你的阶段目标，开启共学奇遇',
      energyBadge: '待启航',
      streakDays: 1,
    };
  }
  const raw = Number(goal.process) || 0;
  const pct = raw <= 10 ? Math.min(100, Math.max(0, raw * 10)) : Math.min(100, Math.max(0, raw));
  let energyLevelText = '🌱 初露锋芒 · 邀请学伴一起监督吧';
  let energyBadge = '启航期';
  if (pct >= 100) {
    energyLevelText = '👑 目标圆满达成 · 快去广场分享喜悦！';
    energyBadge = '满级通关';
  } else if (pct >= 70) {
    energyLevelText = '🔥 终局冲刺中 · 距离满级仅一步之遥';
    energyBadge = '高燃冲刺';
  } else if (pct >= 40) {
    energyLevelText = '⚡ 渐入佳境 · 保持节奏，方舟搭子与你同行';
    energyBadge = '稳步进阶';
  }
  let streakDays = 1;
  if (goal.start_time) {
    const startMs = new Date(goal.start_time).getTime();
    if (!isNaN(startMs)) {
      const diff = Math.floor((Date.now() - startMs) / (1000 * 60 * 60 * 24)) + 1;
      streakDays = Math.max(1, Math.min(diff, 365));
    }
  }
  return { goalProgressPercent: pct, energyLevelText, energyBadge, streakDays };
};

const getDefaultData = (): IAimData => ({
  recommendations: [],
  recommendationLoading: false,
  recommendationRefreshing: false,
  lastUpdated: '',

  currentGoal: null,
  goalLoading: false,
  goalSaving: false,

  goalProgressPercent: 0,
  energyLevelText: '🌱 立下你的阶段目标，开启共学奇遇',
  energyBadge: '待启航',
  streakDays: 1,

  showGoalModal: false,
  isEditingGoal: false,
  goalForm: {
    content: '',
    deadline: '',
    process: '0',
    review: '',
  },

  showDevBanner: false,
});

Page<IAimPageData, IAimData>({
  data: getDefaultData(),

  onLoad() {},

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().init();
    }
    this.setData({
      showDevBanner: isDevMode() && isGuestMode(),
    });
    this.init();
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  onPullDownRefresh() {
    this.init();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 450);
  },

  onShareAppMessage() {
    const goalText = this.data.currentGoal?.content?.split('\n')[0] || '以终为始 · AI 英语与技能共学';
    return {
      title: `🎯 我在自塾立下阶段目标：「${goalText.slice(0, 22)}」，快来一起打卡！`,
      path: '/pages/aim/index',
    };
  },

  init() {
    this.loadRecommendations();
    this.loadGoal();
  },

  getUserId(): number {
    const userInfo = wx.getStorageSync('userInfo') || {};
    return Number(userInfo.userId || userInfo.id || wx.getStorageSync('userId') || 0);
  },

  applyGoalState(goal: Goal | null) {
    const meta = computeEnergyMeta(goal);
    this.setData({
      currentGoal: goal,
      goalLoading: false,
      ...meta,
    });
  },

  // 加载推荐数据（优先请求真实后端 /api/actions/recommendations，失败时回退高价值共学推荐）
  loadRecommendations(isRefresh = false) {
    if (isRefresh) {
      this.setData({ recommendationRefreshing: true });
    } else {
      this.setData({ recommendationLoading: true });
    }

    if ((isDevMode() && isGuestMode()) || !http.isLoggedIn()) {
      this.setData({
        recommendations: fallbackRecommendations,
        recommendationLoading: false,
        recommendationRefreshing: false,
        lastUpdated: formatTime(),
      });
      if (isRefresh) {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '已刷新今日推荐',
          icon: 'check-circle',
          duration: 1500,
        });
      }
      return;
    }

    const userId = this.getUserId();
    const query = userId ? `?user_id=${userId}` : '';

    http
      .get(`/api/actions/recommendations${query}`, undefined, { silentAuthError: true })
      .then((res: any) => {
        const list =
          res && Array.isArray(res.recommendations) && res.recommendations.length > 0
            ? res.recommendations
            : fallbackRecommendations;
        this.setData({
          recommendations: list,
          recommendationLoading: false,
          recommendationRefreshing: false,
          lastUpdated: formatTime(),
        });
        if (isRefresh) {
          Toast({
            context: this,
            selector: '#t-toast',
            message: '已为您智能刷新今日行动',
            icon: 'check-circle',
            duration: 1500,
          });
        }
      })
      .catch(() => {
        this.setData({
          recommendations: fallbackRecommendations,
          recommendationLoading: false,
          recommendationRefreshing: false,
          lastUpdated: formatTime(),
        });
        if (isRefresh) {
          Toast({
            context: this,
            selector: '#t-toast',
            message: '已刷新今日推荐',
            icon: 'check-circle',
            duration: 1500,
          });
        }
      });
  },

  // 加载目标数据（真实后端接口 + 本地缓存兜底）
  loadGoal() {
    this.setData({ goalLoading: true });

    const savedGoal = wx.getStorageSync('savedGoal') || null;

    if (isDevMode() && isGuestMode()) {
      this.applyGoalState(savedGoal || mockGoal);
      wx.stopPullDownRefresh();
      return;
    }

    const userId = this.getUserId();
    if (!userId || !http.isLoggedIn()) {
      this.applyGoalState(savedGoal);
      wx.stopPullDownRefresh();
      return;
    }

    http
      .requestWithRefresh({
        url: `/api/users/fetch_goal/${userId}`,
        method: 'GET',
        silentAuthError: true,
      })
      .then((res: any) => {
        const goal = res && Object.keys(res).length > 0 && res.content ? res : savedGoal;
        if (goal) {
          wx.setStorageSync('savedGoal', goal);
        }
        this.applyGoalState(goal);
        wx.stopPullDownRefresh();
      })
      .catch(() => {
        this.applyGoalState(savedGoal);
        wx.stopPullDownRefresh();
      });
  },

  async onRefreshRecommendation() {
    const goalId = this.data.currentGoal?.id;
    const userId = this.getUserId();
    if (userId && goalId) {
      try {
        await http.requestWithRefresh({
          url: '/api/actions/plan',
          method: 'POST',
          data: { goal_id: Number(goalId) },
        });
      } catch {}
    }
    this.loadRecommendations(true);
  },

  onRecommendationItemTap(e: any) {
    const { item, index } = e.detail || {};
    if (!item) return;
    wx.showActionSheet({
      itemList: [
        `🚀 立即前往：${item.title || '执行微行动'}`,
        '✎ 自定义修改该微行动标题',
      ],
      success: (res) => {
        if (res.tapIndex === 0 && item.action_url) {
          this.navigateByActionUrl(item.action_url, item.title);
        } else if (res.tapIndex === 1) {
          wx.showModal({
            title: '✎ 自定义微行动标题',
            editable: true,
            placeholderText: item.title || '输入更贴合你今日节奏的行动描述',
            success: async (m: any) => {
              const newTitle = String(m.content || '').trim();
              if (!m.confirm || !newTitle) return;
              if (item.action_id) {
                try {
                  await http.requestWithRefresh({
                    url: `/api/actions/${item.action_id}/title`,
                    method: 'POST',
                    data: { custom_title: newTitle, title: newTitle },
                  });
                } catch {}
              }
              const list = [...(this.data.recommendations || [])];
              if (list[index]) {
                list[index] = { ...list[index], title: newTitle };
                this.setData({ recommendations: list });
              }
              wx.showToast({ title: '✅ 行动标题已更新', icon: 'none' });
            },
          });
        }
      },
    });
  },

  async onArchiveAndNewGoal() {
    const goal = this.data.currentGoal;
    if (!goal || this.data.goalSaving) return;
    const userId = this.getUserId();
    this.setData({ goalSaving: true });
    try {
      if (userId && goal.id) {
        await http.requestWithRefresh({
          url: '/api/users/save_goal',
          method: 'POST',
          data: {
            goal_id: goal.id,
            content: goal.content,
            deadline: (goal.deadline || '').substring(0, 10),
            process: 100,
            review: goal.review || '阶段目标圆满达成！',
            action: '完成',
            status: 'achieved',
          },
        });
      }
    } catch {} finally {
      this.setData({ goalSaving: false });
    }
    wx.removeStorageSync('savedGoal');
    wx.showToast({ title: '🏆 已归档达成目标！', icon: 'success' });
    this.onCreateGoal();
  },

  onRecommendationActionTap(e: any) {
    const { item } = e.detail || {};
    if (!item || !item.action_url) return;
    if (item.action_id) {
      http
        .requestWithRefresh({
          url: `/api/actions/${item.action_id}/click`,
          method: 'POST',
        })
        .catch(() => {});
    }
    this.navigateByActionUrl(item.action_url, item.title);
  },

  async onRecommendationFinishTap(e: any) {
    const { item, index } = e.detail || {};
    if (!item) return;
    if (item.action_id) {
      try {
        await http.requestWithRefresh({
          url: `/api/actions/${item.action_id}/finish`,
          method: 'POST',
        });
      } catch {}
    }
    const list = (this.data.recommendations || []).filter((_: any, i: number) => i !== index);
    this.setData({
      recommendations: list.length > 0 ? list : fallbackRecommendations.slice(0, 2),
      lastUpdated: formatTime(),
    });
    await this.onUpdateProgress();
  },

  onRecommendationSkipTap(e: any) {
    const { item, index } = e.detail || {};
    if (!item) return;
    const reasons = ['已完成类似任务', '当前时间不够', '与现阶段目标不匹配', '想换个共学方向'];
    wx.showActionSheet({
      itemList: reasons,
      success: async (res) => {
        const reason = reasons[res.tapIndex] || '用户主动跳过';
        if (item.action_id) {
          try {
            await http.requestWithRefresh({
              url: `/api/actions/${item.action_id}/abandon`,
              method: 'POST',
              data: { reason },
            });
          } catch {}
        }
        const remaining = (this.data.recommendations || []).filter((_: any, i: number) => i !== index);
        const existingIds = new Set(remaining.map((r: any) => r.id));
        const replacement = fallbackRecommendations.find((r) => !existingIds.has(r.id));
        if (replacement && remaining.length < 3) {
          remaining.push(replacement);
        }
        this.setData({
          recommendations: remaining,
          lastUpdated: formatTime(),
        });
        Toast({
          context: this,
          selector: '#t-toast',
          message: `已记录「${reason}」并为您换新推荐`,
          icon: 'check-circle',
          duration: 1500,
        });
      },
    });
  },

  navigateByActionUrl(actionUrl: string, title?: string) {
    const cleanPath = actionUrl.split('?')[0];
    if (TAB_BAR_PAGES.indexOf(cleanPath) !== -1) {
      wx.switchTab({ url: cleanPath });
    } else if (actionUrl.startsWith('/')) {
      wx.navigateTo({ url: actionUrl });
    } else {
      Toast({
        context: this,
        selector: '#t-toast',
        message: `前往: ${title || actionUrl}`,
        icon: '',
        duration: 1500,
      });
    }
  },

  // 快捷入口：去同路人广场找共学搭子
  onFindGoalBuddy() {
    wx.navigateTo({ url: '/pages/all/index' });
  },

  // 快捷入口：预约目标面谈
  onQuickGoaltalk() {
    wx.navigateTo({ url: '/pages/goaltalk/index' });
  },

  // 快捷入口：召唤 AI 伴学助手拆解目标
  onOpenAiCoach() {
    wx.navigateTo({ url: '/pages/agent/index' });
  },

  onEditGoal() {
    const goal = this.data.currentGoal;
    const rawProcess = goal ? Number(goal.process) || 0 : 0;
    const normalizedProcess = rawProcess > 10 ? Math.round(rawProcess / 10) : rawProcess;
    this.setData({
      showGoalModal: true,
      isEditingGoal: true,
      goalForm: {
        content: goal?.content || '',
        deadline: (goal?.deadline || '').substring(0, 10),
        process: String(normalizedProcess),
        review: goal?.review || '',
      },
    });
  },

  onCreateGoal() {
    this.setData({
      showGoalModal: true,
      isEditingGoal: false,
      goalForm: {
        content: '',
        deadline: getTodayDateStr(),
        process: '0',
        review: '',
      },
    });
  },

  onCloseGoalModal() {
    this.setData({ showGoalModal: false });
  },

  onGoalContentInput(e: any) {
    this.setData({ 'goalForm.content': e.detail.value });
  },

  onGoalDeadlineChange(e: any) {
    this.setData({ 'goalForm.deadline': e.detail.value });
  },

  onGoalProcessInput(e: any) {
    this.setData({ 'goalForm.process': e.detail.value });
  },

  onGoalReviewInput(e: any) {
    this.setData({ 'goalForm.review': e.detail.value });
  },

  async onConfirmGoalModal() {
    if (this.data.goalSaving) return;
    const { goalForm, currentGoal } = this.data;
    const content = (goalForm.content || '').trim();
    if (!content) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请输入目标内容',
        icon: 'info-circle',
        duration: 2000,
      });
      return;
    }

    const deadline = (goalForm.deadline || '').trim();
    if (!deadline) {
      Toast({
        context: this,
        selector: '#t-toast',
        message: '请选择截止日期',
        icon: 'info-circle',
        duration: 2000,
      });
      return;
    }

    let proc = parseInt(goalForm.process, 10);
    if (isNaN(proc) || proc < 0) proc = 0;
    if (proc > 10) proc = Math.min(Math.round(proc / 10), 10);

    const userId = this.getUserId();
    const review = (goalForm.review || '').trim();
    const updatedGoal: Goal = {
      id: currentGoal?.id || Date.now(),
      user_id: currentGoal?.user_id || userId || 1001,
      content,
      start_time: currentGoal?.start_time || getTodayDateStr(),
      deadline,
      process: proc,
      review,
    };

    this.setData({ goalSaving: true });
    try {
      if (userId) {
        const res: any = await http.requestWithRefresh({
          url: '/api/users/save_goal',
          method: 'POST',
          data: {
            goal_id: currentGoal?.id || 0,
            content,
            deadline,
            process: proc,
            review,
            status: 'active',
          },
        });
        if (res && res.goal_id) {
          updatedGoal.id = res.goal_id;
        }
      }
    } catch (e) {
      // 离线或游客态仍保留本地持久化
    } finally {
      this.setData({ goalSaving: false, showGoalModal: false });
    }

    wx.setStorageSync('savedGoal', updatedGoal);
    this.applyGoalState(updatedGoal);

    Toast({
      context: this,
      selector: '#t-toast',
      message: '🎯 目标已同步保存！',
      icon: 'check-circle',
      duration: 1500,
    });
  },

  // 更新进度（每步推进 10%，满 100% 触发通关祝贺，并同步后端）
  async onUpdateProgress() {
    const goal = this.data.currentGoal;
    if (!goal || this.data.goalSaving) return;

    const currentVal = Number(goal.process) || 0;
    const normalizedStep = currentVal > 10 ? Math.round(currentVal / 10) : currentVal;
    const newProgress = Math.min(normalizedStep + 1, 10);
    const updatedGoal: Goal = {
      ...goal,
      process: newProgress,
    };

    wx.setStorageSync('savedGoal', updatedGoal);
    this.applyGoalState(updatedGoal);

    const userId = this.getUserId();
    if (userId && goal.id) {
      http
        .requestWithRefresh({
          url: '/api/users/update_progress',
          method: 'POST',
          data: {
            goal_id: goal.id,
            process: newProgress,
          },
        })
        .catch(() => {});
    }

    const msg =
      newProgress >= 10
        ? '🎉 恭喜達成 100% 满级目标！快去同路人广场分享喜悦吧'
        : `⚡ 进度已推进至 ${newProgress * 10}%，继续加油！`;

    Toast({
      context: this,
      selector: '#t-toast',
      message: msg,
      icon: 'check-circle',
      duration: 1800,
    });
  },
});

interface IAimPageData extends IAimData {}
