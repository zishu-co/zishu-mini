// @ts-nocheck

/**
 * pages/inno-detail/index.ts
 * 创新项目详情页
 */

import {
  fetchProjectsFromApi,
  claimProject,
  getInnoTaskDetail,
  updateInnoProject,
  saveInnoTask,
  Project,
} from '../../services/inno/inno';
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
  submittingTask: boolean;
  currentUserId: number;
  showHalfModal: boolean;
  halfProgressText: string;
  showSlnModal: boolean;
  slnForm: {
    content: string;
    actual_hour: number;
  };
  showReviewModal: boolean;
  reviewForm: {
    comment: string;
    reward: number;
  };
};

Page<IInnoDetailPageData, any>({
  data: {
    project: null,
    loading: false,
    claiming: false,
    submittingTask: false,
    currentUserId: 0,
    showHalfModal: false,
    halfProgressText: '核心方案已完成 50%，进入验证阶段',
    showSlnModal: false,
    slnForm: {
      content: '',
      actual_hour: 6,
    },
    showReviewModal: false,
    reviewForm: {
      comment: '',
      reward: 0,
    },
  },

  projectId: 0,

  onLoad(options: any) {
    this.projectId = parseInt(options?.id || '1', 10) || 1;
    const _appInno = getApp<any>();
    const storedUserInfo = wx.getStorageSync('userInfo') || {};
    const userInfo = _appInno?.globalData?.userInfo || storedUserInfo || {};
    const currentUserId =
      Number(wx.getStorageSync('userId') || userInfo.userId || userInfo.id || storedUserInfo.userId || storedUserInfo.id || 0);
    this.setData({ currentUserId });
    this.loadProject();
  },

  noop() {},

  onShow() {
    if (this.projectId && !this.data.project && !this.data.loading) {
      this.loadProject();
    }
  },

  onPullDownRefresh() {
    this.loadProject().finally(() => wx.stopPullDownRefresh());
  },

  onShareAppMessage() {
    const title = this.data.project?.title || '自塾创新实战项目';
    return {
      title: `🚀 邀你一起参与自塾创新项目《${title}》！`,
      path: `/pages/inno-detail/index?id=${this.projectId}`,
    };
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
    return Promise.all([
      getInnoTaskDetail(this.projectId).catch(() => null),
      fetchProjectsFromApi().catch(() => []),
    ])
      .then(([taskDetail, list]) => {
        const fromList = (list || []).find((p: Project) => Number(p.id) === Number(this.projectId)) || null;
        const mergedRaw =
          taskDetail && taskDetail.id
            ? { ...(fromList || {}), ...taskDetail }
            : fromList;
        const project = mergedRaw ? this.decorateProject(mergedRaw) : null;
        this.setData({ project, loading: false });
      })
      .catch(() => {
        this.setData({ loading: false });
        wx.showToast({ title: '加载项目详情失败', icon: 'none' });
      });
  },

  onOpenHalfModal() {
    const cur = this.data.project?.half_progress || '核心方案已完成 50%，进入联调验证阶段';
    this.setData({
      showHalfModal: true,
      halfProgressText: cur,
    });
  },

  onSelectHalfPreset(e: any) {
    const text = e.currentTarget.dataset.text || '';
    if (text) {
      this.setData({ halfProgressText: text });
    }
  },

  onHalfInput(e: any) {
    this.setData({ halfProgressText: e.detail.value });
  },

  async onSubmitHalfReport() {
    if (this.data.submittingTask || !this.projectId) return;
    const half_progress = String(this.data.halfProgressText || '').trim();
    if (!half_progress) {
      wx.showToast({ title: '请填写半程进度说明', icon: 'none' });
      return;
    }
    this.setData({ submittingTask: true });
    try {
      await updateInnoProject(this.projectId, {
        action: 'half_report',
        half_progress,
      });
      wx.showToast({ title: '📊 半程进度已更新！', icon: 'success' });
      this.setData({ showHalfModal: false });
      await this.loadProject();
    } catch {
      wx.showToast({ title: '汇报提交失败', icon: 'none' });
    } finally {
      this.setData({ submittingTask: false });
    }
  },

  onOpenSlnModal() {
    const p = this.data.project;
    this.setData({
      showSlnModal: true,
      slnForm: {
        content: p?.sln_text || '',
        actual_hour: Number(p?.actual_hour || p?.planed_hour || 6),
      },
    });
  },

  onSlnInput(e: any) {
    const field = e.currentTarget.dataset.field;
    if (!field) return;
    this.setData({
      [`slnForm.${field}`]: e.detail.value,
    });
  },

  async onSubmitSolution(e: any) {
    if (this.data.submittingTask || !this.projectId) return;
    const mode = e.currentTarget.dataset.mode || 'submit_sln';
    const content = String(this.data.slnForm.content || '').trim();
    const actual_hour = Math.max(0.5, Number(this.data.slnForm.actual_hour) || 1);
    if (!content) {
      wx.showToast({ title: '请填写解决方案内容', icon: 'none' });
      return;
    }
    this.setData({ submittingTask: true });
    try {
      const res: any = await saveInnoTask({
        id: this.projectId,
        action: mode === 'save_sln' ? 'save_sln' : 'submit_sln',
        content,
        title: this.data.project?.title || '',
        actual_hour,
      });
      wx.showToast({
        title: mode === 'save_sln' ? '💾 方案草稿已暂存' : '🚀 解决方案已正式提交！',
        icon: 'none',
      });
      this.setData({ showSlnModal: false });
      await this.loadProject();
    } catch {
      wx.showToast({ title: '保存方案失败', icon: 'none' });
    } finally {
      this.setData({ submittingTask: false });
    }
  },

  onOpenReviewModal() {
    const p = this.data.project;
    this.setData({
      showReviewModal: true,
      reviewForm: {
        comment: p?.comment || '方案架构清晰、落地扎实，同意结项验收！',
        reward: Number((p as any)?.reward || 0),
      },
    });
  },

  onReviewInput(e: any) {
    const field = e.currentTarget.dataset.field;
    if (!field) return;
    this.setData({
      [`reviewForm.${field}`]: e.detail.value,
    });
  },

  async onSubmitReview(e: any) {
    if (this.data.submittingTask || !this.projectId) return;
    const action = e.currentTarget.dataset.action || 'save_comment';
    const comment = String(this.data.reviewForm.comment || '').trim();
    const reward = Math.max(0, Number(this.data.reviewForm.reward) || 0);
    if (!comment) {
      wx.showToast({ title: '请填写点评或验收意见', icon: 'none' });
      return;
    }
    this.setData({ submittingTask: true });
    try {
      await saveInnoTask({
        id: this.projectId,
        action,
        content: comment,
        title: this.data.project?.title || '',
        reward,
      });
      const toastMap: Record<string, string> = {
        save_comment: '💬 塾师点评已保存',
        redo: '🔄 已退回要求返工迭代',
        finish_task: '🏆 结项验收通过！塾值已结算',
      };
      wx.showToast({
        title: toastMap[action] || '操作成功',
        icon: 'none',
      });
      this.setData({ showReviewModal: false });
      await this.loadProject();
    } catch {
      wx.showToast({ title: '操作失败，请稍后重试', icon: 'none' });
    } finally {
      this.setData({ submittingTask: false });
    }
  },

  onCloseTaskModals() {
    this.setData({
      showHalfModal: false,
      showSlnModal: false,
      showReviewModal: false,
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
        `👋 发起《${title}》15分钟课题协作沟通`,
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
