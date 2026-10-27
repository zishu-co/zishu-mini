// @ts-nocheck
/**
 * pages/course-detail/index.ts
 * 课程详情页
 */
import {
  getCourseDetail,
  fetchCurrentSelections,
  selectCourse,
  quitCourse,
  calMentors,
  selectMentor,
  quickUpdateCourse,
  CourseDetail,
  Mentor,
} from '../../services/course/course';
import { quickGreetPeer } from '../../services/user/user';

type IPageData = {
  courseId: number;
  loading: boolean;
  submitting: boolean;
  submittingMentor: boolean;
  activeTab: 'chapters' | 'current' | 'finish';
  courseDetail: CourseDetail | null;
  currentUserId: number;
  // 选课状态
  selectedIds: number[];
  isSelected: boolean;
  currentSelectionsCount: number;
  hasLogin: boolean;
  // 塾师选择弹窗
  showMentorModal: boolean;
  mentorList: (Mentor & { _initial?: string; _isDirector?: boolean })[];
  pendingEnrollBeforeMentor: boolean;
  // 塾主编辑课程弹窗
  showEditModal: boolean;
  editTitle: string;
  editDesc: string;
  submittingEdit: boolean;
};

Page<IPageData, IPageData>({
  data: {
    courseId: 0,
    loading: true,
    submitting: false,
    submittingMentor: false,
    activeTab: 'chapters',
    courseDetail: null,
    currentUserId: 0,
    selectedIds: [],
    isSelected: false,
    currentSelectionsCount: 0,
    hasLogin: false,
    showMentorModal: false,
    mentorList: [],
    pendingEnrollBeforeMentor: false,
    showEditModal: false,
    editTitle: '',
    editDesc: '',
    submittingEdit: false,
  },

  courseId: 0,

  resolveUserId(): number {
    const app = getApp<any>();
    return (
      app?.globalData?.userId ||
      app?.globalData?.userInfo?.userId ||
      wx.getStorageSync('userId') ||
      wx.getStorageSync('userInfo')?.userId ||
      0
    );
  },

  onLoad(options: any) {
    this.courseId = parseInt(options.id || options.courseId || '0', 10);
    const userId = this.resolveUserId();
    this.setData({ courseId: this.courseId, currentUserId: userId });
    if (this.courseId) {
      if (options.title) {
        wx.setNavigationBarTitle({ title: decodeURIComponent(options.title) });
      }
      Promise.all([this.loadDetail(), this.loadSelections()]);
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  onShow() {
    const userId = this.resolveUserId();
    if (userId !== this.data.currentUserId) {
      this.setData({ currentUserId: userId });
    }
    if (this.courseId) {
      this.loadSelections();
    }
  },

  onPullDownRefresh() {
    Promise.all([this.loadDetail(), this.loadSelections()])
      .finally(() => wx.stopPullDownRefresh());
  },

  onTabChange(e: any) {
    const tab = e.currentTarget.dataset.tab as 'chapters' | 'current' | 'finish';
    if (tab && tab !== this.data.activeTab) {
      this.setData({ activeTab: tab });
    }
  },

  getInitialChar(name: string | undefined, fallback = '塾'): string {
    if (!name || typeof name !== 'string') return fallback;
    const trimmed = name.trim();
    return trimmed ? trimmed.charAt(0) : fallback;
  },

  loadDetail() {
    this.setData({ loading: true });
    return getCourseDetail(this.courseId)
      .then((res: any) => {
        if (res) {
          const rawChapters = Array.isArray(res.chapters) ? res.chapters : [];
          res.chapters = rawChapters.map((ch: any, idx: number) => {
            const num = idx + 1;
            return {
              ...ch,
              _stepNum: num < 10 ? `0${num}` : `${num}`,
            };
          });

          const currentList = Array.isArray(res.current)
            ? res.current
            : Array.isArray(res.current_selections)
            ? res.current_selections
            : [];
          const finishList = Array.isArray(res.finish)
            ? res.finish
            : Array.isArray(res.finish_selections)
            ? res.finish_selections
            : [];

          res.current = currentList.map((item: any) => ({
            ...item,
            _avatarChar: this.getInitialChar(item.user_name, '生'),
            deadlineText: this.formatDate(item.deadline),
            deadlineClass: this.getDeadlineClass(item.deadline),
          }));
          res.finish = finishList.map((item: any) => ({
            ...item,
            _avatarChar: this.getInitialChar(item.user_name, '毕'),
            finishDateText: this.formatDate(item.finish_date),
          }));
          res.current_selections = res.current;
          res.finish_selections = res.finish;
        }
        const cid = Number(res?.course?.id || this.courseId);
        const isSelected = this.data.selectedIds.includes(cid);
        this.setData({ courseDetail: res, isSelected, loading: false });
        if (res?.course?.title) {
          wx.setNavigationBarTitle({ title: res.course.title });
        }
      })
      .catch(() => {
        this.setData({ loading: false });
        wx.showToast({ title: '加载失败，请下拉重试', icon: 'none' });
      });
  },

  /** 加载当前用户的选课状态 */
  loadSelections() {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken');
    if (!token) {
      this.setData({ hasLogin: false, selectedIds: [], isSelected: false, currentSelectionsCount: 0 });
      return Promise.resolve();
    }
    this.setData({ hasLogin: true });
    return fetchCurrentSelections()
      .then((list) => {
        const safeList = Array.isArray(list) ? list : [];
        const ids = safeList.map((c: any) => Number(c.course_id));
        const cid = Number(this.data.courseDetail?.course?.id || this.courseId);
        const isSelected = ids.includes(cid);
        this.setData({
          selectedIds: ids,
          isSelected,
          currentSelectionsCount: safeList.length,
        });
      })
      .catch(() => {
        this.setData({ selectedIds: [], isSelected: false, currentSelectionsCount: 0 });
      });
  },

  /** 拉取可选塾师列表 */
  async fetchAvailableMentors(courseId: number) {
    const res = await calMentors(courseId);
    const mentors: (Mentor & { _initial?: string; _isDirector?: boolean })[] = [];

    if (res && res.director_id && (res.mentor_count || 0) < 3) {
      mentors.push({
        shushi_id: res.director_id,
        shushi_name: res.director_name || '课程塾主',
        course_id: res.course_id || courseId,
        _initial: this.getInitialChar(res.director_name, '主'),
        _isDirector: true,
      });
    }
    if (res && Array.isArray(res.mentors)) {
      for (const m of res.mentors) {
        if (m && m.shushi_id && m.shushi_name) {
          mentors.push({
            ...m,
            _initial: this.getInitialChar(m.shushi_name, '师'),
            _isDirector: false,
          });
        }
      }
    }
    return mentors;
  },

  /** 选课：加载可选塾师弹窗，允许选课并绑定塾师 */
  async onSelectCourse() {
    if (this.data.submitting || this.data.submittingMentor) return;
    const { courseDetail, currentSelectionsCount } = this.data;
    const currentUserId = this.data.currentUserId || this.resolveUserId();
    if (!courseDetail) return;

    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken');
    if (!token || !currentUserId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => wx.navigateTo({ url: '/pages/login/login' }), 1000);
      return;
    }

    if (currentSelectionsCount >= 3) {
      wx.showToast({ title: '最多同时在修3门课', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      const mentors = await this.fetchAvailableMentors(this.courseId);
      if (mentors.length > 0) {
        this.setData({
          showMentorModal: true,
          mentorList: mentors,
          pendingEnrollBeforeMentor: true,
          submitting: false,
        });
        return;
      }
    } catch (e) {
      // 若获取塾师失败则降级为直接确认选课
    }
    this.setData({ submitting: false });
    this.confirmDirectSelectCourse();
  },

  /** 已选课状态下打开选择/更换塾师弹窗 */
  async onOpenMentorModal() {
    if (this.data.submittingMentor || this.data.submitting) return;
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    this.setData({ submittingMentor: true });
    try {
      const mentors = await this.fetchAvailableMentors(this.courseId);
      this.setData({
        showMentorModal: true,
        mentorList: mentors,
        pendingEnrollBeforeMentor: false,
      });
    } catch (e) {
      wx.showToast({ title: '加载塾师列表失败', icon: 'none' });
    } finally {
      this.setData({ submittingMentor: false });
    }
  },

  onCloseMentorModal() {
    if (this.data.submittingMentor) return;
    this.setData({ showMentorModal: false, pendingEnrollBeforeMentor: false });
  },

  /** 在弹窗中选择某位塾师（若尚未选课则先执行 selectCourse 再执行 selectMentor） */
  async onConfirmMentor(e: any) {
    if (this.data.submittingMentor || this.data.submitting) return;
    const shushiId = Number(e.currentTarget.dataset.shushiid);
    const shushiName = e.currentTarget.dataset.shushiname || '塾师';
    const currentUserId = this.data.currentUserId || this.resolveUserId();
    if (!shushiId || !currentUserId) return;

    this.setData({ submittingMentor: true, submitting: true });
    wx.showLoading({ title: '正在办理选课...', mask: true });
    try {
      if (this.data.pendingEnrollBeforeMentor && !this.data.isSelected) {
        await selectCourse(currentUserId, this.courseId);
      }
      await selectMentor(shushiId, this.courseId);
      wx.hideLoading();
      wx.showToast({ title: `选课成功 · 塾师 ${shushiName}`, icon: 'success' });
      this.setData({ showMentorModal: false, pendingEnrollBeforeMentor: false });
      await Promise.all([this.loadDetail(), this.loadSelections()]);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '操作失败，请重试', icon: 'none' });
    } finally {
      this.setData({ submittingMentor: false, submitting: false });
    }
  },

  /** 在弹窗中点击“先选课，稍后选塾师” */
  async onDirectSelectCourse() {
    if (this.data.submitting || this.data.submittingMentor) return;
    const currentUserId = this.data.currentUserId || this.resolveUserId();
    if (!currentUserId) return;

    this.setData({ submitting: true, submittingMentor: true });
    wx.showLoading({ title: '选课中...', mask: true });
    try {
      await selectCourse(currentUserId, this.courseId);
      wx.hideLoading();
      wx.showToast({ title: '选课成功', icon: 'success' });
      this.setData({ showMentorModal: false, pendingEnrollBeforeMentor: false });
      await Promise.all([this.loadDetail(), this.loadSelections()]);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '选课失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false, submittingMentor: false });
    }
  },

  confirmDirectSelectCourse() {
    const { courseDetail } = this.data;
    const currentUserId = this.data.currentUserId || this.resolveUserId();
    if (!courseDetail || !currentUserId) return;

    wx.showModal({
      title: '确认选课',
      content: '确定要选择「' + courseDetail.course.title + '」吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ submitting: true });
          wx.showLoading({ title: '选课中...', mask: true });
          selectCourse(currentUserId, this.courseId)
            .then(() => {
              wx.hideLoading();
              wx.showToast({ title: '选课成功', icon: 'success' });
              return Promise.all([this.loadDetail(), this.loadSelections()]);
            })
            .catch(() => {
              wx.hideLoading();
              wx.showToast({ title: '选课失败', icon: 'none' });
            })
            .finally(() => {
              this.setData({ submitting: false });
            });
        }
      },
    });
  },

  /** 退选 */
  async onQuitCourse() {
    if (this.data.submitting) return;
    const { courseDetail } = this.data;
    const currentUserId = this.data.currentUserId || this.resolveUserId();
    if (!courseDetail) return;

    wx.showModal({
      title: '确认退选',
      content: '请确认是否退选「' + courseDetail.course.title + '」？',
      editable: true,
      placeholderText: '请输入退选理由（选填）',
      success: (res) => {
        if (res.confirm) {
          const reason = res.content || '主动退选';
          this.setData({ submitting: true });
          wx.showLoading({ title: '退选中...', mask: true });
          quitCourse(currentUserId, this.courseId, reason)
            .then(() => {
              wx.hideLoading();
              wx.showToast({ title: '已退选', icon: 'success' });
              return Promise.all([this.loadDetail(), this.loadSelections()]);
            })
            .catch(() => {
              wx.hideLoading();
              wx.showToast({ title: '退选失败', icon: 'none' });
            })
            .finally(() => {
              this.setData({ submitting: false });
            });
        }
      },
    });
  },

  onDeselectCourse() {
    return this.onQuitCourse();
  },

  /** 快捷入口：组方舟搭子舱 */
  onGoArkGroup() {
    if (!this.courseId) return;
    wx.navigateTo({ url: `/pages/ark-group/index?courseId=${this.courseId}` });
  },

  /** 快捷入口：结课闯关测验 */
  onGoCourseQuiz() {
    const paperId = (this.data.courseDetail?.course as any)?.paper_id;
    if (!paperId) return;
    wx.navigateTo({ url: `/pages/test/test?id=${paperId}&testid=${paperId}` });
  },

  /** 快捷入口：结课申请页 */
  onGoFinishCourse() {
    if (!this.courseId) return;
    wx.navigateTo({ url: `/pages/finish-course/index?course_id=${this.courseId}` });
  },

  /** 格式化日期（截取前10位） */
  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    return String(dateStr).substring(0, 10);
  },

  /** 截止日期颜色class */
  getDeadlineClass(deadline: string | undefined): string {
    if (!deadline) return '';
    const ts = new Date(deadline).getTime();
    if (isNaN(ts)) return 'badge-red';
    const diffDays = (ts - Date.now()) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) return 'badge-red';
    if (diffDays <= 1) return 'badge-orange';
    if (diffDays <= 3) return 'badge-blue';
    return 'badge-normal';
  },

  /** 跳转到章节URL */
  onChapterTap(e: any) {
    const url = e.currentTarget.dataset.url as string;
    const title = e.currentTarget.dataset.title as string;
    if (!url) {
      wx.showToast({ title: '该章节暂无外链内容', icon: 'none' });
      return;
    }
    if (url.startsWith('/pages/')) {
      wx.navigateTo({ url });
      return;
    }
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showModal({
          title: title || '章节学习链接已复制',
          content: '受小程序外链限制，学习链接已复制到剪贴板，请打开浏览器粘贴访问。',
          showCancel: false,
          confirmText: '知道了',
        });
      },
    });
  },

  /** 编辑课程（仅塾主可见） */
  onEditCourse() {
    const course = this.data.courseDetail?.course;
    if (!course) return;
    this.setData({
      showEditModal: true,
      editTitle: course.title || '',
      editDesc: course.desc || '',
    });
  },

  onCloseEditModal() {
    if (this.data.submittingEdit) return;
    this.setData({ showEditModal: false });
  },

  onEditTitleInput(e: any) {
    this.setData({ editTitle: e.detail.value || '' });
  },

  onEditDescInput(e: any) {
    this.setData({ editDesc: e.detail.value || '' });
  },

  async onConfirmEditCourse() {
    if (this.data.submittingEdit) return;
    const title = (this.data.editTitle || '').trim();
    const desc = (this.data.editDesc || '').trim();
    if (!title) {
      wx.showToast({ title: '课程名称不能为空', icon: 'none' });
      return;
    }
    this.setData({ submittingEdit: true });
    try {
      await quickUpdateCourse(this.courseId, title, desc);
      wx.showToast({ title: '课程信息已更新', icon: 'success' });
      this.setData({ showEditModal: false, submittingEdit: false });
      this.loadDetail();
    } catch (err: any) {
      this.setData({ submittingEdit: false });
      wx.showToast({ title: err?.detail || '更新失败，请重试', icon: 'none' });
    }
  },

  /** 点击在学同塾/结课校友卡片：发起共学约聊或查看学习单 */
  onClassmateTap(e: any) {
    const userId = Number(e.currentTarget.dataset.userid || 0);
    const userName = e.currentTarget.dataset.username || '同塾伙伴';
    const courseTitle = this.data.courseDetail?.course?.title || '自塾课程';

    wx.showActionSheet({
      itemList: [
        `👋 约 ${userName} 15分钟共学破冰`,
        `📋 查看 ${userName} 的学习单`,
        `🚢 邀请共组「${courseTitle}」诺亚方舟`,
      ],
      success: async (res) => {
        if (res.tapIndex === 0) {
          if (!userId) {
            wx.showToast({ title: `👋 已向 ${userName} 发送共学问候`, icon: 'none' });
            return;
          }
          try {
            const greetRes: any = await quickGreetPeer({
              target_user_id: userId,
              topic: `📚 同修《${courseTitle}》· 15分钟共学交流`,
              planed_duration: 15,
            });
            wx.showModal({
              title: '🎉 已发起同课共学约聊',
              content: greetRes?.message || `已创建与 ${userName} 的15分钟目标面谈记录，快去目标面谈页查看吧！`,
              confirmText: '去查看',
              cancelText: '留在当前',
              success: (m) => {
                if (m.confirm) {
                  wx.navigateTo({ url: '/pages/goaltalk/index' });
                }
              },
            });
          } catch (err) {
            wx.showToast({ title: `👋 已向 ${userName} 发送同课问候`, icon: 'none' });
          }
        } else if (res.tapIndex === 1) {
          if (userId) {
            wx.navigateTo({ url: `/pages/learn-sheet/index?userId=${userId}` });
          } else {
            wx.navigateTo({ url: '/pages/learn-sheet/index' });
          }
        } else if (res.tapIndex === 2) {
          this.onGoArkGroup();
        }
      },
    });
  },
});
