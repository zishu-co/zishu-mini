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
  CourseDetail,
} from '../../services/course/course';

type IPageData = {
  loading: boolean;
  submitting: boolean;
  courseDetail: CourseDetail | null;
  currentUserId: number;
  // 选课状态
  selectedIds: number[];
  isSelected: boolean;
  currentSelectionsCount: number;
  hasLogin: boolean;
};

Page<IPageData, IPageData>({
  data: {
    loading: true,
    submitting: false,
    courseDetail: null,
    currentUserId: 0,
    selectedIds: [],
    isSelected: false,
    currentSelectionsCount: 0,
    hasLogin: false,
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
    this.courseId = parseInt(options.id || '0', 10);
    const userId = this.resolveUserId();
    this.setData({ currentUserId: userId });
    if (this.courseId) {
      wx.setNavigationBarTitle({ title: options.title || '课程详情' });
      Promise.all([this.loadDetail(), this.loadSelections()]);
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  onShow() {
    // 从登录页返回后刷新用户信息与选课状态
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

  loadDetail() {
    this.setData({ loading: true });
    return getCourseDetail(this.courseId)
      .then((res: any) => {
        if (res) {
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
            deadlineText: this.formatDate(item.deadline),
            deadlineClass: this.getDeadlineClass(item.deadline),
          }));
          res.finish = finishList.map((item: any) => ({
            ...item,
            finishDateText: this.formatDate(item.finish_date),
          }));
          res.current_selections = res.current;
          res.finish_selections = res.finish;
        }
        const cid = res?.course?.id || this.courseId;
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
        const cid = this.data.courseDetail?.course?.id || this.courseId;
        const isSelected = ids.includes(Number(cid));
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

  /** 选课 */
  async onSelectCourse() {
    if (this.data.submitting) return;
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
      wx.showToast({ title: '最多选3门课', icon: 'none' });
      return;
    }

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
      }
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
      }
    });
  },

  onDeselectCourse() {
    return this.onQuitCourse();
  },

  /** 格式化日期（截取前10位） */
  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    return dateStr.substring(0, 10);
  },

  /** 截止日期颜色class */
  getDeadlineClass(deadline: string | undefined): string {
    if (!deadline) return '';
    const ts = new Date(deadline).getTime();
    if (isNaN(ts)) return 'text-red';
    const diffDays = (ts - Date.now()) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) return 'text-red';
    if (diffDays <= 1) return 'text-orange';
    if (diffDays <= 3) return 'text-blue';
    return '';
  },

  /** 跳转到章节URL */
  onChapterTap(e: any) {
    const url = e.currentTarget.dataset.url as string;
    if (!url) {
      wx.showToast({ title: '暂无链接', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showModal({
          title: '章节链接',
          content: '链接已复制，请在浏览器中粘贴打开',
          showCancel: false,
          confirmText: '知道了',
        });
      },
    });
  },

  /** 编辑课程（仅塾主可见） */
  onEditCourse() {
    wx.showToast({ title: '编辑功能开发中', icon: 'none' });
  },
});
