// @ts-nocheck

/**
 * pages/inno-detail/index.ts
 * 创新项目详情页
 */

import { fetchProjectsFromApi, claimProject } from '../../services/inno/inno';
import { Project } from '../../services/inno/inno';
import { quickGreetPeer } from '../../services/user/user';

type IInnoProjectView = Project & {
  _statusColor: string;
  _statusText: string;
  _startDate: string;
  _deadline: string;
  _isDeadlinePassed: boolean;
  _step2Active: boolean;
  _step3Active: boolean;
};

type IInnoDetailPageData = {
  project: IInnoProjectView | null;
  loading: boolean;
  claiming: boolean;
  currentUserId: number;
};

Page<IInnoDetailPageData, any>({
  data: {
    project: null,
    loading: false,
    claiming: false,
    currentUserId: 0,
  },

  projectId: 0,

  onLoad(options: any) {
    this.projectId = parseInt(options?.id || '0', 10);
    const _appInno = getApp<any>();
    const storedUserInfo = wx.getStorageSync('userInfo') || {};
    const userInfo = _appInno?.globalData?.userInfo || storedUserInfo || {};
    const currentUserId =
      Number(wx.getStorageSync('userId') || userInfo.userId || userInfo.id || storedUserInfo.userId || storedUserInfo.id || 0);
    this.setData({ currentUserId });
    if (this.projectId) {
      this.loadProject();
    }
  },

  onShow() {
    if (this.projectId && !this.data.project && !this.data.loading) {
      this.loadProject();
    }
  },

  onPullDownRefresh() {
    this.loadProject().finally(() => wx.stopPullDownRefresh());
  },

  onRetry() {
    if (this.projectId) {
      this.loadProject();
    } else {
      wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/inno/index' }) });
    }
  },

  decorateProject(raw: Project): IInnoProjectView {
    const _statusText = this.getStatusText(raw);
    const _statusColor = this.getStatusColor(raw);
    const _startDate = raw.start_date ? String(raw.start_date).substring(0, 10) : '—';
    const _deadline = raw.deadline ? String(raw.deadline).substring(0, 10) : '—';
    const _isDeadlinePassed = this.isDeadlinePassed(raw.deadline);
    const _step3Active = !!(raw.finish_date || raw.half_progress === '已完成');
    const _step2Active = _step3Active || !!(raw.taker || raw.half_progress);
    return {
      ...raw,
      _statusColor,
      _statusText,
      _startDate,
      _deadline,
      _isDeadlinePassed,
      _step2Active,
      _step3Active,
    };
  },

  loadProject() {
    this.setData({ loading: true });
    return fetchProjectsFromApi()
      .then((list) => {
        const found = (list || []).find((p: Project) => Number(p.id) === Number(this.projectId)) || null;
        const project = found ? this.decorateProject(found) : null;
        this.setData({ project, loading: false });
      })
      .catch(() => {
        this.setData({ loading: false });
        wx.showToast({ title: '加载项目详情失败', icon: 'none' });
      });
  },

  /** 认领项目 */
  claimProject() {
    if (this.data.claiming) return;

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
          this.setData({ claiming: true });
          wx.showLoading({ title: '提交中...', mask: true });
          claimProject(this.projectId)
            .then(() => {
              wx.hideLoading();
              wx.showToast({ title: '认领成功', icon: 'success' });
              this.loadProject();
            })
            .catch(() => {
              wx.hideLoading();
              wx.showToast({ title: '认领失败，请稍后重试', icon: 'none' });
            })
            .finally(() => {
              this.setData({ claiming: false });
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

  /** 联系项目发布人/执行人/指导塾师开展共创协作 */
  onContactProjectPeer(e: any) {
    const roleLabel = e.currentTarget.dataset.role || '项目伙伴';
    const peerName = e.currentTarget.dataset.name || '';
    const peerId = Number(e.currentTarget.dataset.userid || 0);
    const title = this.data.project?.title || '创新项目';

    if (!peerName || peerName === '待认领' || peerName === '—') {
      wx.showToast({ title: '当前暂无对应成员', icon: 'none' });
      return;
    }

    wx.showActionSheet({
      itemList: [
        `👋 发起《${title}》15分钟协作约聊`,
        `🔍 在共学广场查找「${peerName}」`,
      ],
      success: async (res) => {
        if (res.tapIndex === 0) {
          if (peerId) {
            try {
              await quickGreetPeer({
                target_user_id: peerId,
                topic: `🚀 创新项目《${title}》协作交流（联系${roleLabel}：${peerName}）`,
                planed_duration: 15,
              });
            } catch (err) {
              // ignore
            }
          }
          wx.showModal({
            title: '🤝 已发起项目协作邀约',
            content: `已向${roleLabel}「${peerName}」发送《${title}》协作沟通请求，可前往目标面谈页跟进时间。`,
            confirmText: '去目标面谈',
            cancelText: '知道了',
            success: (m) => {
              if (m.confirm) {
                wx.navigateTo({ url: '/pages/goaltalk/index' });
              }
            },
          });
        } else if (res.tapIndex === 1) {
          wx.navigateTo({ url: '/pages/all/index' });
        }
      },
    });
  },
});
