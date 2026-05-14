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
  courseDetail: CourseDetail | null;
  currentUserId: number;
  // 选课状态
  selectedIds: number[];
  currentSelectionsCount: number;
  hasLogin: boolean;
};

Page<IPageData, IPageData>({
  data: {
    loading: false,
    courseDetail: null,
    currentUserId: 0,
    selectedIds: [],
    currentSelectionsCount: 0,
    hasLogin: false,
  },

  courseId: 0,

  onLoad(options: any) {
    this.courseId = parseInt(options.id || '0', 10);
    const app = getApp<any>();
    const userInfo = app.globalData?.userInfo || {};
    this.setData({ currentUserId: userInfo.userId || 0 });
    if (this.courseId) {
      wx.setNavigationBarTitle({ title: options.title || '课程详情' });
      this.loadDetail();
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().init();
    }
  },

  onPullDownRefresh() {
    Promise.all([this.loadDetail(), this.loadSelections()])
      .finally(() => wx.stopPullDownRefresh());
  },

  loadDetail() {
    this.setData({ loading: true });
    return getCourseDetail(this.courseId)
      .then((res) => {
        this.setData({ courseDetail: res, loading: false });
        if (res?.course?.title) {
          wx.setNavigationBarTitle({ title: res.course.title });
        }
      })
      .catch(() => {
        this.setData({ loading: false });
      });
  },

  /** 加载当前用户的选课状态 */
  loadSelections() {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken');
    if (!token) {
      this.setData({ hasLogin: false, selectedIds: [], currentSelectionsCount: 0 });
      return Promise.resolve();
    }
    this.setData({ hasLogin: true });
    return fetchCurrentSelections()
      .then((list) => {
        const safeList = Array.isArray(list) ? list : [];
        const ids = safeList.map((c: any) => c.course_id);
        this.setData({ selectedIds: ids, currentSelectionsCount: safeList.length });
      })
      .catch(() => {
        this.setData({ selectedIds: [], currentSelectionsCount: 0 });
      });
  },

  /** 选课 */
  async onSelectCourse() {
    const { courseDetail, currentSelectionsCount, currentUserId } = this.data;
    if (!courseDetail) return;

    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken');
    if (!token || currentUserId == null) {
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
          wx.showLoading({ title: '选课中...', mask: true });
          selectCourse(currentUserId, this.courseId)
            .then(() => {
              wx.hideLoading();
              wx.showToast({ title: '选课成功', icon: 'success' });
              this.loadSelections();
            })
            .catch(() => {
              wx.hideLoading();
              wx.showToast({ title: '选课失败', icon: 'none' });
            });
        }
      }
    });
  },

  /** 退选 */
  async onQuitCourse() {
    const { courseDetail, currentUserId } = this.data;
    if (!courseDetail) return;

    wx.showModal({
      title: '确认退选',
      content: '请确认是否退选「' + courseDetail.course.title + '」？',
      editable: true,
      placeholderText: '请输入退选理由（选填）',
      success: (res) => {
        if (res.confirm) {
          const reason = res.content || '主动退选';
          wx.showLoading({ title: '退选中...', mask: true });
          quitCourse(currentUserId, this.courseId, reason)
            .then(() => {
              wx.hideLoading();
              wx.showToast({ title: '已退选', icon: 'success' });
              this.loadSelections();
            })
            .catch(() => {
              wx.hideLoading();
              wx.showToast({ title: '退选失败', icon: 'none' });
            });
        }
      }
    });
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
});
