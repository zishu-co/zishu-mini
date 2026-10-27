// @ts-nocheck

/**
 * pages/inno/index.ts
 * 创新页面 - 项目列表
 */

import { fetchInno, fetchProjectsFromApi, claimProject, Project, TabItem } from '../../services/inno/inno';

const _app = getApp<any>();

type DecoratedProject = Project & {
  statusClass: 'completed' | 'in-progress' | 'pending';
  statusText: '已完成' | '进行中' | '待认领';
  deadlineColor: 'overdue' | 'warning' | 'normal';
  deadlineText: string;
};

interface InnoGroupItem {
  key: string;
  badge: string;
  name: string;
  desc: string;
  mentor: string;
  projectCount: number;
  openCount: number;
  totalBonus: number;
}

const DEFAULT_GROUPS_META: Array<{ key: string; badge: string; name: string; desc: string; mentor: string }> = [
  {
    key: 'F',
    badge: 'F · 前端研发组',
    name: 'Web & 小程序交互创新组',
    desc: '聚焦 Vue3、微信小程序与 AI 原生交互体验落地，打造流畅的共学产品界面。',
    mentor: '青桐塾师团',
  },
  {
    key: 'B',
    badge: 'B · 后端架构组',
    name: 'FastAPI 与智能体引擎组',
    desc: '负责高可用 API、PostgreSQL/pgvector 检索与多智能体工作流编排研发。',
    mentor: '架构导师组',
  },
  {
    key: 'D',
    badge: 'D · 知识工程组',
    name: '技术文档与开源沉淀组',
    desc: '将实战经验转化为结构化工程规范、开源文档与可复用知识库。',
    mentor: '开源委员会',
  },
  {
    key: 'C',
    badge: 'C · 课程共创组',
    name: 'AI 时代精品课程研发组',
    desc: '设计以终为始的闯关式课程、实战案例与自动化评测题库。',
    mentor: '教研塾主团',
  },
];

type IInnoPageData = {
  imgSrcs: string[];
  tabList: TabItem[];
  projectList: DecoratedProject[];
  filteredList: DecoratedProject[];
  filteredProjects: DecoratedProject[];
  groupList: InnoGroupItem[];
  filteredGroups: InnoGroupItem[];
  viewMode: 'projects' | 'groups';
  activeTab: string;
  statusFilter: 'all' | 'pending' | 'in-progress' | 'completed';
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

Page<IInnoPageData, any>({
  data: {
    imgSrcs: [],
    tabList: [],
    projectList: [],
    filteredList: [],
    filteredProjects: [],
    groupList: [],
    filteredGroups: [],
    viewMode: 'projects',
    activeTab: '',
    statusFilter: 'all',
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
    setTimeout(() => wx.stopPullDownRefresh(), 450);
  },

  onShareAppMessage() {
    return {
      title: '🚀 自塾创新实战揭榜大厅 · 认领开源与工程项目，赢取高额塾值悬赏！',
      path: '/pages/inno/index',
    };
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

  buildGroups(projects: DecoratedProject[]): InnoGroupItem[] {
    return DEFAULT_GROUPS_META.map((meta) => {
      const matched = projects.filter(
        (p) => p.task_serial && p.task_serial[0].toUpperCase() === meta.key
      );
      const openCount = matched.filter((p) => p.statusClass === 'pending').length;
      const totalBonus = matched.reduce((sum, p) => sum + (Number(p.bonus) || 0), 0);
      return {
        ...meta,
        projectCount: matched.length,
        openCount,
        totalBonus,
      };
    });
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
        const groupList = this.buildGroups(formattedList);
        this.setData({ projectList: formattedList, groupList });
        this.applyFilters(this.data.activeTab, this.data.statusFilter, this.data.searchKeyword);
        this.setData({ listLoading: false });
        wx.stopPullDownRefresh();
      })
      .catch(() => {
        const groupList = this.buildGroups(this.data.projectList || []);
        this.setData({ listLoading: false, groupList, filteredGroups: groupList });
        wx.stopPullDownRefresh();
        wx.showToast({ title: '加载项目失败，请稍后重试', icon: 'none' });
      });
  },

  /** 切换项目 / 小组视图 */
  onSwitchMode(e: any) {
    const mode = e.currentTarget.dataset.mode;
    if (!mode || mode === this.data.viewMode) return;
    this.setData({ viewMode: mode });
  },

  /** 点击状态筛选胶囊 */
  onStatusFilterTap(e: any) {
    const status = e.currentTarget.dataset.status || 'all';
    if (status === this.data.statusFilter) return;
    this.applyFilters(this.data.activeTab, status, this.data.searchKeyword);
  },

  /** 重置筛选条件 */
  onResetFilters() {
    this.setData({
      searchKeyword: '',
      statusFilter: 'all',
      activeTab: '',
    });
    this.applyFilters('', 'all', '');
  },

  /** 点击小组卡片 → 切回该项目分类 */
  onGroupCardTap(e: any) {
    const key = e.currentTarget.dataset.key || '';
    this.setData({ viewMode: 'projects' });
    this.applyFilters(key, 'all', this.data.searchKeyword);
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
    this.applyFilters(this.data.activeTab, this.data.statusFilter, kw);
  },

  /** 搜索提交 */
  onSearchSubmit(e: any) {
    const kw = (e?.detail?.value ?? this.data.searchKeyword ?? '').trim();
    this.applyFilters(this.data.activeTab, this.data.statusFilter, kw);
  },

  /** 清空搜索 */
  onSearchClear() {
    this.applyFilters(this.data.activeTab, this.data.statusFilter, '');
  },

  /** 按类型过滤 */
  filterByTab(key: string) {
    this.applyFilters(key, this.data.statusFilter, this.data.searchKeyword);
  },

  /** 综合应用分类、状态与关键词过滤 */
  applyFilters(
    tabKey: string,
    statusFilter: 'all' | 'pending' | 'in-progress' | 'completed',
    keyword: string
  ) {
    const kw = (keyword || '').toLowerCase();
    const filteredProjects = (this.data.projectList || []).filter((p) => {
      const matchTab =
        !tabKey || (p.task_serial && p.task_serial[0].toUpperCase() === tabKey.toUpperCase());
      if (!matchTab) return false;
      if (statusFilter !== 'all' && p.statusClass !== statusFilter) return false;
      if (!kw) return true;
      const title = (p.title || '').toLowerCase();
      const serial = (p.task_serial || '').toLowerCase();
      const desc = (p.desc || '').toLowerCase();
      const taker = (p.taker || '').toLowerCase();
      const shushi = (p.shushi || '').toLowerCase();
      return (
        title.includes(kw) ||
        serial.includes(kw) ||
        desc.includes(kw) ||
        taker.includes(kw) ||
        shushi.includes(kw)
      );
    });

    const filteredGroups = (this.data.groupList || []).filter((g) => {
      if (!kw) return true;
      return (
        g.name.toLowerCase().includes(kw) ||
        g.desc.toLowerCase().includes(kw) ||
        g.badge.toLowerCase().includes(kw) ||
        g.mentor.toLowerCase().includes(kw)
      );
    });

    this.setData({
      activeTab: tabKey,
      statusFilter,
      searchKeyword: keyword,
      filteredList: filteredProjects,
      filteredProjects,
      filteredGroups,
    });
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
