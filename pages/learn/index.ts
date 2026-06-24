// @ts-nocheck

// pages/learn/index.ts
// 课程学习首页：我的选课 + 全部课程 + 考试入口
import {
  fetchAllCourses,
  fetchCurrentSelections,
  selectCourse,
  quitCourse,
  reportLearn,
  calMentors,
  selectMentor,
  CurrentSelection,
  Course,
  Mentor,
} from '../../services/course/course';

const app = getApp();

interface ILearnPageData {
  myCourses: CurrentSelection[];
  allCourses: Course[];
  selectedIds: number[];
  loading: boolean;
  hasLogin: boolean;
  showMentorModal: boolean;
  mentorList: Mentor[];
  currentMentorCourseId: number;
  showReportModal: boolean;
  reportCourse: CurrentSelection | null;
  reportHour: string;
}

Page<ILearnPageData, ILearnPageData>({
  data: {
    myCourses: [],
    allCourses: [],
    selectedIds: [],
    loading: true,
    hasLogin: false,
    showMentorModal: false,
    mentorList: [],
    currentMentorCourseId: 0,
    showReportModal: false,
    reportCourse: null,
    reportHour: '',
  },

  onLoad() {},

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().init();
    }
    this.checkLoginAndLoad();
  },

  onPullDownRefresh() {
    this.checkLoginAndLoad();
    setTimeout(() => wx.stopPullDownRefresh(), 500);
  },

  checkLoginAndLoad() {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken');
    this.setData({ hasLogin: !!token });
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken');

    try {
      if (token) {
        // 已登录：同时拉取我的选课 + 全部课程
        const [myCourses, allCourses] = await Promise.all([
          fetchCurrentSelections(),
          fetchAllCourses(),
        ]);
        const safeMyCourses = Array.isArray(myCourses) ? myCourses : [];
        const safeAllCourses = Array.isArray(allCourses) ? allCourses : [];
        const selectedIds = safeMyCourses.map((c: CurrentSelection) => c.course_id);
        this.setData({
          myCourses: safeMyCourses,
          allCourses: safeAllCourses,
          selectedIds,
          loading: false,
        });
      } else {
        // 未登录：只拉取全部课程，让访客也能浏览课程列表
        const allCourses = await fetchAllCourses();
        const safeAllCourses = Array.isArray(allCourses) ? allCourses : [];
        this.setData({
          allCourses: safeAllCourses,
          loading: false,
        });
      }
    } catch (e: any) {
      console.error('加载数据失败', e);
      if (e?.statusCode === 401 || e?.errMsg?.includes('401')) {
        // 只有登录态过期（之前有 token）才清空并引导重新登录
        if (token) {
          wx.removeStorageSync('accessToken');
          wx.removeStorageSync('refreshToken');
          this.setData({ hasLogin: false, loading: false });
          wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
          setTimeout(() => wx.navigateTo({ url: '/pages/login/login' }), 1500);
          return;
        }
        // 未登录访客 API 401：静默处理，不跳转
        this.setData({ loading: false });
        return;
      }
      this.setData({ loading: false });
    }
  },

  async onSelectCourse(e: any) {
    const courseId = e.currentTarget.dataset.id;
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    const userId = app.globalData.userInfo?.userId;

    if (!token || userId == null) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => wx.navigateTo({ url: '/pages/login/login' }), 1000);
      return;
    }

    const isSelected = this.data.selectedIds.includes(courseId);
    if (isSelected) {
      try {
        wx.showLoading({ title: '退选处理中...', mask: true });
        await quitCourse(userId, courseId, '主动退选');
        wx.hideLoading();
        wx.showToast({ title: '已退选', icon: 'success' });
        this.loadData();
      } catch (e) {
        wx.hideLoading();
        wx.showToast({ title: '退选失败', icon: 'none' });
      }
    } else {
      if (this.data.selectedIds.length >= 3) {
        wx.showToast({ title: '最多选3门课', icon: 'none' });
        return;
      }
      try {
        wx.showLoading({ title: '选课中...', mask: true });
        await selectCourse(userId, courseId);
        wx.hideLoading();
        wx.showToast({ title: '选课成功', icon: 'success' });
        this.loadData();
      } catch (e) {
        wx.hideLoading();
        wx.showToast({ title: '选课失败', icon: 'none' });
      }
    }
  },

  async onSelectMentor(e: any) {
    const courseId = e.currentTarget.dataset.courseid;
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    try {
      const res = await calMentors(courseId);
      const mentors: Mentor[] = [];

      if (res.director_id && res.mentor_count < 3) {
        mentors.push({
          shushi_id: res.director_id,
          shushi_name: res.director_name,
          course_id: res.course_id,
        });
      }
      if (res.mentors && res.mentors.length > 0) {
        mentors.push(...res.mentors.filter((m: Mentor) => m.shushi_id && m.shushi_name));
      }

      this.setData({
        showMentorModal: true,
        mentorList: mentors,
        currentMentorCourseId: courseId,
      });
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  async onConfirmMentor(e: any) {
    const shushiId = e.currentTarget.dataset.shushiid;
    const shushiName = e.currentTarget.dataset.shushiname;
    const courseId = this.data.currentMentorCourseId;

    try {
      await selectMentor(shushiId, courseId);
      wx.showToast({ title: '已选择' + shushiName, icon: 'success' });
      this.setData({ showMentorModal: false });
      this.loadData();
    } catch (e) {
      wx.showToast({ title: '选择失败', icon: 'none' });
    }
  },

  onCloseMentorModal() {
    this.setData({ showMentorModal: false });
  },

  /** 组方舟：跳到独立 ark-group 页面 */
  onJoinArk(e: any) {
    const courseId = e.currentTarget.dataset.courseid;
    if (!courseId) return;
    if (!this.data.hasLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => wx.navigateTo({ url: '/pages/login/login' }), 1000);
      return;
    }
    wx.navigateTo({ url: `/pages/ark-group/index?courseId=${courseId}` });
  },

  onReportLearn(e: any) {
    const course: CurrentSelection = e.currentTarget.dataset.course;
    this.setData({
      showReportModal: true,
      reportCourse: course,
      reportHour: '',
    });
  },

  onReportHourInput(e: any) {
    this.setData({ reportHour: e.detail.value });
  },

  async onConfirmReport() {
    const { reportCourse, reportHour } = this.data;
    if (!reportCourse) return;

    const hour = parseFloat(reportHour);
    if (isNaN(hour) || hour <= 0) {
      wx.showToast({ title: '请输入正确学时', icon: 'none' });
      return;
    }
    if (hour > 5) {
      wx.showToast({ title: '申报学时不能超过5小时', icon: 'none' });
      return;
    }

    const userId = app.globalData.userInfo?.userId;
    if (userId == null) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    try {
      await reportLearn(
        reportCourse.chapter_id,
        reportCourse.course_id,
        reportCourse.chapter_title,
        reportCourse.sele_id,
        reportHour,
      );
      wx.showToast({ title: '申报成功', icon: 'success' });
      this.setData({ showReportModal: false, reportHour: '' });
      this.loadData();
    } catch (e: any) {
      wx.showToast({ title: e?.message || '申报失败', icon: 'none' });
    }
  },

  onCloseReportModal() {
    this.setData({ showReportModal: false });
  },

  onGoToChapter(e: any) {
    const url = e.currentTarget.dataset.url;
    if (!url) {
      wx.showToast({ title: '暂无学习链接', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: url,
      success: () => {
        wx.showModal({
          title: '学习链接',
          content: '链接已复制，请在浏览器中粘贴打开',
          showCancel: false,
          confirmText: '知道了'
        });
      }
    });
  },

  getDeadlineClass(deadline: string): string {
    if (!deadline) return '';
    const ts = new Date(deadline).getTime();
    if (isNaN(ts)) return 'deadline-red';
    const diffDays = (ts - Date.now()) / (1000 * 60 * 60 * 24);
    if (diffDays < 0 && diffDays > -30) return 'deadline-brand';
    if (diffDays < -30) return 'deadline-red';
    if (diffDays <= 1) return 'deadline-orange';
    if (diffDays <= 3) return 'deadline-blue';
    return '';
  },

  onCourseItemTap(e: any) {
    const courseId = e.currentTarget.dataset.id;
    const title = e.currentTarget.dataset.title || '课程详情';
    const url = '/pages/course-detail/index?id=' + courseId + '&title=' + encodeURIComponent(title);
    wx.navigateTo({ url });
  },

  onGotoExam() {
    wx.navigateTo({ url: '/pages/exam/index' });
  },

  onGotoReport() {
    wx.navigateTo({ url: '/pages/report/index' });
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },
});
