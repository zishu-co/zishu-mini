// @ts-nocheck

/**
 * pages/inno/index.ts
 * 创新页面 - 项目列表
 */

import { fetchInno, fetchProjectsFromApi, claimProject, Project, TabItem } from '../../services/inno/inno';

const _app = getApp<any>();

type IInnoPageData = {
  imgSrcs: string[];
  tabList: TabItem[];
  projectList: Project[];
  filteredList: Project[];
  activeTab: string;
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
    this.getTabBar().init();
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

  loadProjects(fresh = false) {
    if (fresh) {
      wx.pageScrollTo({ scrollTop: 0 });
    }

    this.setData({ listLoading: true });

    fetchProjectsFromApi()
      .then((list) => {
        // 格式化日期（只保留到日）
        const formattedList = list.map((item: any) => ({
          ...item,
          deadline: item.deadline && item.deadline.length > 10
            ? item.deadline.substring(0, 10)
            : item.deadline,
        }));
        this.setData({ projectList: formattedList });
        this.filterByTab('');
        this.setData({ listLoading: false });
        wx.stopPullDownRefresh();
      })
      .catch(() => {
        this.setData({ listLoading: false });
        wx.stopPullDownRefresh();
      });
  },

  /** 标签切换 */
  tabChangeHandle(e: any) {
    const index = e.detail;
    const tab = this.data.tabList[index];
    const key = tab?.key || '';
    this.privateData.tabIndex = index;
    this.filterByTab(key);
  },

  /** 按类型过滤 */
  filterByTab(key: string) {
    if (!key) {
      this.setData({ filteredList: this.data.projectList, activeTab: '' });
      return;
    }
    const filtered = this.data.projectList.filter(
      (p) => p.task_serial && p.task_serial[0].toUpperCase() === key.toUpperCase()
    );
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
    const { id, index } = e.currentTarget.dataset;

    // 检查登录状态
    const token = wx.getStorageSync('refreshToken');
    if (!token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }

    wx.showModal({
      title: '确认认领',
      content: '确定要认领该项目吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '提交中...', mask: true });
          claimProject(id)
            .then(() => {
              wx.hideLoading();
              wx.showToast({ title: '认领成功', icon: 'success' });
              // 刷新列表
              this.loadProjects(true);
            })
            .catch(() => {
              wx.hideLoading();
              wx.showToast({ title: '认领失败', icon: 'none' });
            });
        }
      },
    });
  },

  /** 获取项目状态标签 */
  getStatusTag(status: string, taker: string): string {
    if (status === '已完成') return '已完成';
    if (taker) return '进行中';
    return '待认领';
  },

  /** 获取截止日期颜色 */
  getDeadlineColor(deadline: string): string {
    if (!deadline) return '';
    const now = new Date();
    const dl = new Date(deadline);
    if (dl < now) return 'red';
    return '';
  },
});
