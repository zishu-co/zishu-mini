// @ts-nocheck

/**
 * pages/inno/index.ts
 * 创新页面 - 项目列表
 */

import {
  fetchInno,
  fetchProjectsFromApi,
  claimProject,
  fetchNextSerial,
  addInnoProject,
  fetchAllGroupsFromApi,
  joinInnoGroup,
  Project,
  TabItem,
} from '../../services/inno/inno';

const _app = getApp<any>();

type DecoratedProject = Project & {
  statusClass: 'completed' | 'in-progress' | 'pending';
  statusText: '已完成' | '进行中' | '待认领';
  deadlineColor: 'overdue' | 'warning' | 'normal';
  deadlineText: string;
};

interface InnoGroupItem {
  id?: number;
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
  showPublishModal: boolean;
  submittingPublish: boolean;
  publishForm: {
    task_type: string;
    task_serial: string;
    title: string;
    required_courses: string;
    bonus: number;
    planed_hour: number;
    start_date: string;
    deadline: string;
    desc: string;
  };
  showJoinGroupModal: boolean;
  submittingJoinGroup: boolean;
  joinGroupForm: {
    groupid: number | string;
    groupname: string;
    reason: string;
  };
};

function defaultDatePlusDays(days = 0): string {
  const dt = new Date(Date.now() + days * 24 * 3600 * 1000);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

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
    showPublishModal: false,
    submittingPublish: false,
    publishForm: {
      task_type: 'F',
      task_serial: 'F001',
      title: '',
      required_courses: '',
      bonus: 20,
      planed_hour: 6,
      start_date: defaultDatePlusDays(0),
      deadline: defaultDatePlusDays(14),
      desc: '',
    },
    showJoinGroupModal: false,
    submittingJoinGroup: false,
    joinGroupForm: {
      groupid: 1,
      groupname: '',
      reason: '',
    },
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

  buildGroups(projects: DecoratedProject[], apiGroups: any[] = []): InnoGroupItem[] {
    const defaults = DEFAULT_GROUPS_META.map((meta, idx) => {
      const matched = projects.filter(
        (p) => p.task_serial && p.task_serial[0].toUpperCase() === meta.key
      );
      const openCount = matched.filter((p) => p.statusClass === 'pending').length;
      const totalBonus = matched.reduce((sum, p) => sum + (Number(p.bonus) || 0), 0);
      return {
        id: idx + 1,
        ...meta,
        projectCount: matched.length,
        openCount,
        totalBonus,
      };
    });
    if (!Array.isArray(apiGroups) || apiGroups.length === 0) {
      return defaults;
    }
    const existingNames = new Set(defaults.map((d) => d.name));
    const extras: InnoGroupItem[] = [];
    for (const g of apiGroups) {
      const gname = String(g.groupname || '').trim();
      if (!gname || existingNames.has(gname)) continue;
      existingNames.add(gname);
      const key = String(g.type || 'F').charAt(0).toUpperCase();
      const matched = projects.filter(
        (p) => p.task_serial && p.task_serial[0].toUpperCase() === key
      );
      extras.push({
        id: Number(g.id) || extras.length + 10,
        key,
        badge: `${g.type || '共创组'} · 认证小组`,
        name: gname,
        desc: g.desc || '围绕真实场景课题展开协作共创与同行评议。',
        mentor: g.admin_name || '领航塾主',
        projectCount: matched.length,
        openCount: matched.filter((p) => p.statusClass === 'pending').length,
        totalBonus: matched.reduce((sum, p) => sum + (Number(p.bonus) || 0), 0),
      });
    }
    return [...extras, ...defaults];
  },

  loadProjects(fresh = false) {
    if (fresh) {
      wx.pageScrollTo({ scrollTop: 0 });
    }

    this.setData({ listLoading: true });

    Promise.all([
      fetchProjectsFromApi(),
      fetchAllGroupsFromApi().catch(() => []),
    ])
      .then(([list, apiGroups]) => {
        const safeList = Array.isArray(list) ? list : [];
        const formattedList = safeList.map((item: any) => this.decorateProject(item));
        const groupList = this.buildGroups(formattedList, apiGroups);
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

  async onOpenPublishModal() {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken');
    if (!token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    const defaultType = this.data.activeTab || 'F';
    const serial = await fetchNextSerial(defaultType);
    this.setData({
      showPublishModal: true,
      publishForm: {
        task_type: defaultType,
        task_serial: serial,
        title: '',
        required_courses: '',
        bonus: 20,
        planed_hour: 6,
        start_date: defaultDatePlusDays(0),
        deadline: defaultDatePlusDays(14),
        desc: '',
      },
    });
  },

  async onSelectPublishType(e: any) {
    const t = e.currentTarget.dataset.type || 'F';
    const serial = await fetchNextSerial(t);
    this.setData({
      'publishForm.task_type': t,
      'publishForm.task_serial': serial,
    });
  },

  onPublishFormInput(e: any) {
    const field = e.currentTarget.dataset.field;
    if (!field) return;
    this.setData({
      [`publishForm.${field}`]: e.detail.value,
    });
  },

  async onSubmitPublishProject() {
    if (this.data.submittingPublish) return;
    const f = this.data.publishForm;
    const title = String(f.title || '').trim();
    const desc = String(f.desc || '').trim();
    if (!title) {
      wx.showToast({ title: '请输入课题标题', icon: 'none' });
      return;
    }
    this.setData({ submittingPublish: true });
    try {
      const res: any = await addInnoProject({
        task_serial: f.task_serial || `${f.task_type || 'F'}001`,
        title,
        required_courses: String(f.required_courses || '').trim(),
        bonus: Math.max(0, Number(f.bonus) || 0),
        planed_hour: Math.max(1, Number(f.planed_hour) || 4),
        start_date: f.start_date || defaultDatePlusDays(0),
        deadline: f.deadline || defaultDatePlusDays(14),
        desc: desc || title,
      });
      if (res && (String(res.code) === '200' || res.project_id)) {
        wx.showToast({ title: '🚀 课题发布成功！', icon: 'success' });
        this.setData({ showPublishModal: false });
        this.loadProjects(true);
      } else {
        wx.showToast({ title: res?.message || '课题已发布', icon: 'none' });
        this.setData({ showPublishModal: false });
        this.loadProjects(true);
      }
    } catch {
      wx.showToast({ title: '发布失败，请稍后重试', icon: 'none' });
    } finally {
      this.setData({ submittingPublish: false });
    }
  },

  onOpenJoinGroupModal(e: any) {
    const item = e.currentTarget.dataset.group;
    if (!item) return;
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken');
    if (!token) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    this.setData({
      showJoinGroupModal: true,
      joinGroupForm: {
        groupid: item.id || item.key || 1,
        groupname: item.name || '创新共创小组',
        reason: `希望加入「${item.name}」参与课题研发与同行共学！`,
      },
    });
  },

  onJoinReasonInput(e: any) {
    this.setData({
      'joinGroupForm.reason': e.detail.value,
    });
  },

  async onSubmitJoinGroup() {
    if (this.data.submittingJoinGroup) return;
    const { groupid, groupname, reason } = this.data.joinGroupForm;
    const cleanReason = String(reason || '').trim();
    if (!cleanReason) {
      wx.showToast({ title: '请填写申请入组理由', icon: 'none' });
      return;
    }
    this.setData({ submittingJoinGroup: true });
    try {
      await joinInnoGroup({
        groupid,
        groupname,
        reason: cleanReason,
      });
      wx.showToast({ title: '🤝 入组申请已提交，等待塾主审核！', icon: 'none' });
      this.setData({ showJoinGroupModal: false });
    } catch {
      wx.showToast({ title: '提交失败，请稍后重试', icon: 'none' });
    } finally {
      this.setData({ submittingJoinGroup: false });
    }
  },

  onCloseInnoModals() {
    this.setData({
      showPublishModal: false,
      showJoinGroupModal: false,
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
