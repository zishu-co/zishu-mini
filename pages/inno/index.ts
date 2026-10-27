// @ts-nocheck

/**
 * pages/inno/index.ts
 * 创新页面 - 项目列表
 */

import { fetchInno, fetchProjectsFromApi, claimProject, Project, TabItem } from '../../services/inno/inno';

const _app = getApp<any>();

type DecoratedProject = Project & {
  statusClass?: 'completed' | 'in-progress' | 'pending';
  statusText?: '已完成' | '进行中' | '待认领';
  deadlineColor?: 'overdue' | 'warning' | 'normal';
  deadlineText?: string;
};

type IInnoPageData = {
  imgSrcs: string[];
  tabList: TabItem[];
  projectList: DecoratedProject[];
  filteredList: DecoratedProject[];
  activeTab: string;
  searchKeyword: string;
  claimingId: number;
  pageLoading: boolean;
  listLoading: boolean;
  current: number;
  autoplay: boolean;
  duration: string;
  interval: number;
  navigation: { type: string };
  swiperImageProps: { mode: string };
};

Page<IInnoPageData, IInnoPageData>({
  data: {
    imgSrcs: [],
    tabList: [],
    projectList: [],
    filteredList: [],
    activeTab: '',
    searchKeyword: '',
    claimingId: 0,
    pageLoading: false,
    listLoading: false,
    current: 1,
    autoplay: true,
    duration: '500',
    interval: 5000,
    navigation: { type: 'dots' },
    swiperImageProps: { mode: 'scaleToFill' },
  },

  // 当前标签索引
  privateData: {
    tabIndex: 0,
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().init();
    }
  },

  onLoad() {
    this.init();
  },

  onPullDownRefresh() {
    this.loadProjects(true);
  },

  init() {
    this.setData({ pageLoading: true });

    // 加载轮播图和标签（使用本地 mock，保证始终有数据）
    fetchInno().then((res) => {
      this.setData({
        imgSrcs: res.swiper,
        tabList: res.tabList,
        pageLoading: false,
      });
      this.loadProjects(true);
    });
  },

  decorateProject(item: any): DecoratedProject {
    const isCompleted = !!(item.finish_date || item.half_progress === '已完成');
    const statusClass: 'completed' | 'in-progress' | 'pending' = isCompleted
      ? 'completed'
      : item.taker
        ? 'in-progress'
        : 'pending';
    const statusText: '已完成' | '进行中' | '待认领' = isCompleted
      ? '已完成'
      : item.taker
        ? '进行中'
        : '待认领';
    const deadlineText =
      item.deadline && item.deadline.length > 10 ? item.deadline.substring(0, 10) : item.deadline || '';
    const deadlineColor = this.getDeadlineColor(deadlineText);
    return {
      ...item,
      deadline: deadlineText,
      deadlineText,
      statusClass,
      statusText,
      deadlineColor,
    };
  },

  loadProjects(fresh = false) {
    if (fresh) {
      wx.pageScrollTo({ scrollTop: 0 });
    }

    this.setData({ listLoading: true });

    fetchProjectsFromApi()
      .then((list) => {
        const safeList = Array.isArray(list) ? list : [];
        const formattedList = safeList.map((item: any) => this.decorateProject(item));
        this.setData({ projectList: formattedList });
        this.filterByTab(this.data.activeTab);
        this.setData({ listLoading: false });
        wx.stopPullDownRefresh();
      })
      .catch(() => {
        this.setData({ listLoading: false });
        wx.stopPullDownRefresh();
        wx.showToast({ title: '加载项目失败，请稍后重试', icon: 'none' });
      });
  },

  /** 标签切换 */
  tabChangeHandle(e: any) {
    const val = e?.detail && typeof e.detail === 'object' ? e.detail.value : e?.detail;
    const index = Number(val) || 0;
    const tab = this.data.tabList[index];
    const key = tab?.key || '';
    this.privateData.tabIndex = index;
    this.filterByTab(key);
  },

  /** 搜索输入变更 */
  onSearchChange(e: any) {
    const kw = (e?.detail?.value ?? '').trim();
    this.setData({ searchKeyword: kw });
    this.filterByTab(this.data.activeTab);
  },

  /** 搜索提交 */
  onSearchSubmit(e: any) {
    const kw = (e?.detail?.value ?? this.data.searchKeyword ?? '').trim();
    this.setData({ searchKeyword: kw });
    this.filterByTab(this.data.activeTab);
  },

  /** 清空搜索 */
  onSearchClear() {
    this.setData({ searchKeyword: '' });
    this.filterByTab(this.data.activeTab);
  },

  /** 按类型 + 搜索词过滤 */
  filterByTab(key: string) {
    const kw = (this.data.searchKeyword || '').toLowerCase();
    const filtered = this.data.projectList.filter((p) => {
      const matchTab =
        !key || (p.task_serial && p.task_serial[0].toUpperCase() === key.toUpperCase());
      if (!matchTab) return false;
      if (!kw) return true;
      const title = (p.title || '').toLowerCase();
      const serial = (p.task_serial || '').toLowerCase();
      const desc = (p.desc || '').toLowerCase();
      const taker = (p.taker || '').toLowerCase();
      return (
        title.includes(kw) ||
        serial.includes(kw) ||
        desc.includes(kw) ||
        taker.includes(kw)
      );
    });
    this.setData({ filteredList: filtered, activeTab: key });
  },

  /** 点击轮播图 */
  navToActivityDetail(detail: any) {
    // 轮播图目前是展示用途，点击不跳转
  },

  /** 点击项目卡片 → 跳转详情页 */
  goToProjectDetail(e: any) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/inno-detail/index?id=${id}` });
  },

  /** 认领项目 */
  claimProject(e: any) {
    const { id } = e.currentTarget.dataset;
    if (!id || this.data.claimingId === id) return;

    // 检查登录状态
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken');
    if (!token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }

    wx.showModal({
      title: '确认认领',
      content: '确定要认领该项目吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ claimingId: id });
          wx.showLoading({ title: '提交中...', mask: true });
          claimProject(id)
            .then(() => {
              wx.hideLoading();
              this.setData({ claimingId: 0 });
              wx.showToast({ title: '认领成功', icon: 'success' });
              // 刷新列表
              this.loadProjects(true);
            })
            .catch(() => {
              wx.hideLoading();
              this.setData({ claimingId: 0 });
              wx.showToast({ title: '认领失败', icon: 'none' });
            });
        }
      },
    });
  },

  /** 获取项目状态标签 */
  getStatusTag(status: string, taker: string): string {
    if (status === '已完成') return 'completed';
    if (taker) return 'in-progress';
    return 'pending';
  },

  /** 获取截止日期颜色 */
  getDeadlineColor(deadline: string): 'overdue' | 'warning' | 'normal' {
    if (!deadline) return 'normal';
    const now = new Date();
    const dl = new Date(deadline.replace(/-/g, '/'));
    if (isNaN(dl.getTime())) return 'normal';
    const diffDays = (dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 3) return 'warning';
    return 'normal';
  },
});
