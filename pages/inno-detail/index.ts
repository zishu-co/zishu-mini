// @ts-nocheck

/**
 * pages/inno-detail/index.ts
 * 创新项目详情页
 */

import { fetchProjectsFromApi, claimProject } from '../../services/inno/inno';
import { Project } from '../../services/inno/inno';

type IInnoDetailPageData = {
  project: Project | null;
  loading: boolean;
  currentUserId: number;
};

Page<IInnoDetailPageData, IInnoDetailPageData>({
  data: {
    project: null,
    loading: false,
    currentUserId: 0,
  },

  projectId: 0,

  onLoad(options: any) {
    this.projectId = parseInt(options.id || '0', 10);
    const _appInno = getApp<any>();
    const userInfo = _appInno.globalData.userInfo || {};
    this.setData({ currentUserId: userInfo.userId || 0 });
    if (this.projectId) {
      this.loadProject();
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().init();
    }
  },

  onPullDownRefresh() {
    this.loadProject().finally(() => wx.stopPullDownRefresh());
  },

  loadProject() {
    this.setData({ loading: true });
    return fetchProjectsFromApi()
      .then((list) => {
        const project = list.find((p: Project) => p.id === this.projectId) || null;
        this.setData({ project, loading: false });
      })
      .catch(() => {
        this.setData({ loading: false });
      });
  },

  /** 认领项目 */
  claimProject() {
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
          claimProject(this.projectId)
            .then(() => {
              wx.hideLoading();
              wx.showToast({ title: '认领成功', icon: 'success' });
              this.loadProject();
            })
            .catch(() => {
              wx.hideLoading();
              wx.showToast({ title: '认领失败', icon: 'none' });
            });
        }
      },
    });
  },

  /** 获取状态文本 */
  getStatusText(project: Project): string {
    if (project.finish_date) return '已完成';
    if (project.taker) return '进行中';
    return '待认领';
  },

  /** 获取状态颜色 */
  getStatusColor(project: Project): string {
    if (project.finish_date) return 'gray';
    if (project.taker) return 'green';
    return 'red';
  },

  /** 判断截止日期是否已过期 */
  isDeadlinePassed(deadline: string): boolean {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  },
});
