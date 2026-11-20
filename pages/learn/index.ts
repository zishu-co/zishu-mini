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
import base from '../../services/base';
import { checkAndSyncAdminStatus } from '../../services/user/user';
import { isCurrentUserAdmin } from '../../utils/env';

const app = getApp();

const CAMP_COMMIT_EXAMPLES: Record<number, string> = {
  1: '我志愿加入塾员预备营。每周保证至少两个小时的学习时间，并在三个月内学完必修课。如有懈怠，我愿意在塾员预备营的微信群发30元红包。',
  2: '我志愿加入塾师预备营。每周保证至少两个小时的学习时间，并在三个月内学完必修课。如有懈怠，我愿意在塾师预备营的微信群发30元红包。',
  3: '我志愿加入塾主预备营。每周保证至少两个小时的学习时间，并在三个月内学完必修课。如有懈怠，我愿意在塾主预备营的微信群发30元红包。',
};

type DecoratedSelection = CurrentSelection & {
  deadlineClass: string;
  deadlineDateStr: string;
};

type DecoratedCourse = Course & {
  isSelected: boolean;
};

interface ILearnPageData {
  myCourses: DecoratedSelection[];
  currentSelections: DecoratedSelection[];
  allCourses: DecoratedCourse[];
  tableData: DecoratedCourse[];
  filteredCourses: DecoratedCourse[];
  availableCount: number;
  courseFilter: 'all' | 'selected' | 'available';
  searchKeyword: string;
  selectedIds: number[];
  loading: boolean;
  loadError: string;
  hasLogin: boolean;
  isAdmin: boolean;
  showMentorModal: boolean;
  mentorList: Mentor[];
  currentMentorCourseId: number;
  showReportModal: boolean;
  reportCourse: CurrentSelection | null;
  reportHour: string;
  submittingMentor: boolean;
  submittingReport: boolean;
  selectingCourseId: number;
}

Page<ILearnPageData, any>({
  data: {
    myCourses: [],
    currentSelections: [],
    allCourses: [],
    tableData: [],
    filteredCourses: [],
    availableCount: 0,
    courseFilter: 'all',
    searchKeyword: '',
    selectedIds: [],
    loading: true,
    loadError: '',
    hasLogin: false,
    isAdmin: false,
    showMentorModal: false,
    mentorList: [],
    currentMentorCourseId: 0,
    showReportModal: false,
    reportCourse: null,
    reportHour: '',
    submittingMentor: false,
    submittingReport: false,
    selectingCourseId: 0,
    // 102-camp.md: 进阶预备营（塾员营 / 塾师营 / 塾主营）
    showCampModal: false,
    activeCampId: 1,
    campLoading: false,
    submittingCamp: false,
    campInfo: null as any,
    campMembers: [] as any[],
    campFinishs: [] as any[],
    campWaitings: [] as any[],
    campPledgeExample: CAMP_COMMIT_EXAMPLES[1],
    campForm: {
      commitment: '',
      signature: '',
    },
    // 103-edit-course.md: 塾主/塾师共创课程与草稿保存
    showEditCourseModal: false,
    savingCourse: false,
    courseForm: {
      courseid: 0,
      title: '',
      desc: '',
      paper_id: '',
      chapters: [
        { id: 0, serial: 1, title: '第1章：导论与核心概念', period: 7, url: '1', paper_id: '' },
      ] as any[],
    },
  },

  onLoad() {},

  onModalTouchMove() {
    // 遮罩、标题和操作区拦截触摸；内容区交给原生 scroll-view。
    return false;
  },

  onCloseLearningModal() {
    this.setData({
      showMentorModal: false,
      showReportModal: false,
      showCampModal: false,
      showEditCourseModal: false,
    });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().init();
    }
    this.checkLoginAndLoad();
  },

  onPullDownRefresh() {
    this.checkLoginAndLoad();
    setTimeout(() => wx.stopPullDownRefresh(), 500);
  },

  onShareAppMessage() {
    return {
      title: '📚 自塾共学选课中心 · 选好课、拜塾师、组方舟结伴通关！',
      path: '/pages/learn/index',
    };
  },

  getUserId() {
    const storedUserInfo = wx.getStorageSync('userInfo') || {};
    return (
      app?.globalData?.userInfo?.userId ||
      app?.globalData?.userId ||
      storedUserInfo?.userId ||
      storedUserInfo?.id ||
      wx.getStorageSync('userId') ||
      null
    );
  },

  checkLoginAndLoad() {
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken');
    const isAdmin = !!token && isCurrentUserAdmin();
    this.setData({ hasLogin: !!token, isAdmin });
    if (token) {
      checkAndSyncAdminStatus(this.getUserId()).then((adminOk) => {
        if (adminOk !== this.data.isAdmin) {
          this.setData({ isAdmin: adminOk });
        }
      });
    }
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true, loadError: '' });
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken');

    try {
      const [myCourses, allCourses] = await Promise.all([
        token ? fetchCurrentSelections() : Promise.resolve([]),
        fetchAllCourses(),
      ]);
      const safeMyCourses = Array.isArray(myCourses) ? myCourses : [];
      const safeAllCourses = Array.isArray(allCourses) ? allCourses : [];
      const selectedIds = safeMyCourses.map((c: CurrentSelection) => c.course_id);
      const decoratedMyCourses: DecoratedSelection[] = safeMyCourses.map((c: CurrentSelection) => ({
        ...c,
        current_serial: Number(c.current_serial) || 1,
        total_chapters: Number(c.total_chapters) || (Number(c.current_serial) > 1 ? Number(c.current_serial) - 1 : 1),
        deadlineClass: this.getDeadlineClass(c.deadline),
        deadlineDateStr: this.formatDateOnly(c.deadline),
      }));
      const decoratedAllCourses: DecoratedCourse[] = safeAllCourses.map((c: Course) => ({
        ...c,
        isSelected: selectedIds.includes(c.id),
      }));
      const availableCount = decoratedAllCourses.filter((c) => !c.isSelected).length;
      this.setData({
        myCourses: decoratedMyCourses,
        currentSelections: decoratedMyCourses,
        allCourses: decoratedAllCourses,
        tableData: decoratedAllCourses,
        availableCount,
        selectedIds,
        loading: false,
        loadError: '',
      });
      this.applyCourseFilters(this.data.courseFilter, this.data.searchKeyword, decoratedAllCourses);
    } catch (e: any) {
      console.error('加载数据失败', e);
      this.setData({
        loading: false,
        loadError: '',
      });
    }
  },

  async onSelectCourse(e: any) {
    const courseId = e.currentTarget.dataset.id;
    if (!courseId || this.data.selectingCourseId === courseId) return;

    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    const userId = this.getUserId();

    if (!token || userId == null) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => wx.navigateTo({ url: '/pages/login/login' }), 1000);
      return;
    }

    const isSelected = this.data.selectedIds.includes(courseId);
    if (isSelected) {
      this.setData({ selectingCourseId: courseId });
      try {
        wx.showLoading({ title: '退选处理中...', mask: true });
        await quitCourse(userId, courseId, '主动退选');
        wx.hideLoading();
        wx.showToast({ title: '已退选', icon: 'success' });
        this.loadData();
      } catch (e) {
        wx.hideLoading();
        wx.showToast({ title: '退选失败', icon: 'none' });
      } finally {
        this.setData({ selectingCourseId: 0 });
      }
    } else {
      if (this.data.selectedIds.length >= 3) {
        wx.showToast({ title: '最多选3门课', icon: 'none' });
        return;
      }
      this.setData({ selectingCourseId: courseId });
      try {
        wx.showLoading({ title: '选课中...', mask: true });
        await selectCourse(userId, courseId);
        wx.hideLoading();
        wx.showToast({ title: '选课成功', icon: 'success' });
        this.loadData();
      } catch (e) {
        wx.hideLoading();
        wx.showToast({ title: '选课失败', icon: 'none' });
      } finally {
        this.setData({ selectingCourseId: 0 });
      }
    }
  },

  async onSelectMentor(e: any) {
    if (this.data.submittingMentor) return;
    const courseId = e.currentTarget.dataset.courseid;
    const token = wx.getStorageSync('accessToken') || wx.getStorageSync('refreshToken') || '';
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ submittingMentor: true });
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
    } finally {
      this.setData({ submittingMentor: false });
    }
  },

  async onConfirmMentor(e: any) {
    if (this.data.submittingMentor) return;
    const shushiId = e.currentTarget.dataset.shushiid;
    const shushiName = e.currentTarget.dataset.shushiname;
    const courseId = this.data.currentMentorCourseId;

    this.setData({ submittingMentor: true });
    try {
      await selectMentor(shushiId, courseId);
      wx.showToast({ title: '已选择' + shushiName, icon: 'success' });
      this.setData({ showMentorModal: false });
      this.loadData();
    } catch (e) {
      wx.showToast({ title: '选择失败', icon: 'none' });
    } finally {
      this.setData({ submittingMentor: false });
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
    if (this.data.submittingReport) return;
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

    const userId = this.getUserId();
    if (userId == null) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ submittingReport: true });
    try {
      const res = await reportLearn(
        reportCourse.chapter_id,
        reportCourse.course_id,
        reportCourse.chapter_title,
        reportCourse.sele_id,
        reportHour,
      );
      this.setData({ showReportModal: false, reportHour: '' });
      this.loadData();
      if (res && res.is_last_lesson) {
        wx.showModal({
          title: '🎉 完成全部章节学习',
          content: '恭喜你已完成本课程所有章节的学时申报！现在去提交结课作业即可解锁荣誉证书。',
          confirmText: '去结课',
          cancelText: '稍后',
          success: (modalRes) => {
            if (modalRes.confirm) {
              wx.navigateTo({ url: `/pages/finish-course/index?course_id=${reportCourse.course_id}` });
            }
          },
        });
      } else {
        wx.showToast({ title: '申报成功', icon: 'success' });
      }
    } catch (e: any) {
      wx.showToast({ title: e?.message || '申报失败', icon: 'none' });
    } finally {
      this.setData({ submittingReport: false });
    }
  },

  onGoFinishCourse(e: any) {
    const courseId = e.currentTarget.dataset.courseid;
    if (!courseId) return;
    wx.navigateTo({ url: `/pages/finish-course/index?course_id=${courseId}` });
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

  formatDateOnly(s: string): string {
    if (!s) return '—';
    const str = String(s);
    if (str.length >= 10) return str.substring(0, 10);
    return str;
  },

  onSearchInput(e: any) {
    const kw = (e?.detail?.value ?? '').trim();
    this.applyCourseFilters(this.data.courseFilter, kw);
  },

  onClearSearch() {
    this.applyCourseFilters(this.data.courseFilter, '');
  },

  onFilterChange(e: any) {
    const filter = e.currentTarget.dataset.filter || 'all';
    if (filter === this.data.courseFilter) return;
    this.applyCourseFilters(filter, this.data.searchKeyword);
  },

  onResetCourseFilter() {
    this.applyCourseFilters('all', '');
  },

  applyCourseFilters(
    courseFilter: 'all' | 'selected' | 'available' | 'hot',
    searchKeyword: string,
    sourceCourses = this.data.allCourses
  ) {
    const kw = (searchKeyword || '').toLowerCase();
    let filteredCourses = (sourceCourses || []).filter((c) => {
      if (courseFilter === 'selected' && !c.isSelected) return false;
      if (courseFilter === 'available' && c.isSelected) return false;
      if (courseFilter === 'hot' && (c.current_selections_num || 0) + (c.finish_selections_num || 0) <= 0) {
        return false;
      }
      if (!kw) return true;
      const title = String(c.title || '').toLowerCase();
      const director = String(c.director_name || '').toLowerCase();
      const desc = String(c.desc || '').toLowerCase();
      return title.includes(kw) || director.includes(kw) || desc.includes(kw);
    });
    if (courseFilter === 'hot') {
      filteredCourses = [...filteredCourses].sort(
        (a, b) =>
          (b.current_selections_num || 0) * 2 +
          (b.finish_selections_num || 0) -
          ((a.current_selections_num || 0) * 2 + (a.finish_selections_num || 0))
      );
    }
    this.setData({
      courseFilter,
      searchKeyword,
      filteredCourses,
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

  onGotoSocialPlaza() {
    wx.navigateTo({ url: '/pages/all/index' });
  },

  onGotoMentors() {
    wx.navigateTo({ url: '/pages/mentors/index' });
  },

  onGotoSupervise() {
    wx.navigateTo({ url: '/pages/supervise/index' });
  },

  // ── 102-camp.md: 进阶预备营（塾员营 / 塾师营 / 塾主营） ──────────────
  onOpenCampModal(e?: any) {
    if (!this.data.hasLogin) {
      this.goToLogin();
      return;
    }
    const campid = Number(e?.currentTarget?.dataset?.campid || this.data.activeCampId || 1);
    this.setData({
      showCampModal: true,
      activeCampId: campid,
      campPledgeExample: CAMP_COMMIT_EXAMPLES[campid] || CAMP_COMMIT_EXAMPLES[1],
      'campForm.commitment': '',
      'campForm.signature': '',
    });
    this.loadCampDetail(campid);
  },

  onCloseCampModal() {
    this.setData({ showCampModal: false });
  },

  onSwitchCampTab(e: any) {
    const campid = Number(e.currentTarget.dataset.campid || 1);
    if (campid === this.data.activeCampId) return;
    this.setData({
      activeCampId: campid,
      campPledgeExample: CAMP_COMMIT_EXAMPLES[campid] || CAMP_COMMIT_EXAMPLES[1],
      'campForm.commitment': '',
    });
    this.loadCampDetail(campid);
  },

  async loadCampDetail(campid: number) {
    this.setData({ campLoading: true });
    try {
      const res: any = await base.get(`/api/learn/get_camp/${campid}`);
      this.setData({
        campInfo: res?.camp || { id: campid, camp_name: campid === 1 ? '塾员预备营' : campid === 2 ? '塾师预备营' : '塾主预备营' },
        campMembers: Array.isArray(res?.members) ? res.members : [],
        campFinishs: Array.isArray(res?.finishs) ? res.finishs : [],
        campWaitings: Array.isArray(res?.waitings) ? res.waitings : [],
        campLoading: false,
      });
    } catch {
      this.setData({
        campInfo: { id: campid, camp_name: campid === 1 ? '塾员预备营' : campid === 2 ? '塾师预备营' : '塾主预备营' },
        campMembers: [],
        campFinishs: [],
        campWaitings: [],
        campLoading: false,
      });
    }
  },

  onFillCampPledge() {
    this.setData({
      'campForm.commitment': this.data.campPledgeExample,
    });
    wx.showToast({ title: '已填入入营承诺书', icon: 'none' });
  },

  onCampFormInput(e: any) {
    const field = e.currentTarget.dataset.field;
    if (!field) return;
    this.setData({ [`campForm.${field}`]: e.detail.value });
  },

  async onSubmitJoinCamp() {
    if (this.data.submittingCamp) return;
    const { commitment, signature } = this.data.campForm;
    if (!String(commitment || '').trim() || !String(signature || '').trim()) {
      wx.showToast({ title: '请填写承诺书并输入真名签字', icon: 'none' });
      return;
    }
    this.setData({ submittingCamp: true });
    try {
      const payload = {
        campid: this.data.activeCampId,
        commitment: String(commitment).trim(),
        signature: String(signature).trim(),
      };
      await base.post('/api/learn/join_camp', { info: JSON.stringify(payload) });
      wx.showToast({ title: '🏕️ 已提交入营申请！', icon: 'success' });
      this.loadCampDetail(this.data.activeCampId);
    } catch {
      wx.showToast({ title: '提交失败，请稍后重试', icon: 'none' });
    } finally {
      this.setData({ submittingCamp: false });
    }
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  // ── 103-edit-course.md: 共创课程（草稿加载/保存 + 正式发布课程） ──
  async onOpenEditCourseModal() {
    if (!this.data.hasLogin) {
      this.goToLogin();
      return;
    }
    this.setData({ showEditCourseModal: true });
    try {
      const drafts: any = await base.get('/api/learn/load_draft');
      if (Array.isArray(drafts) && drafts.length > 0) {
        const myDraft = drafts[drafts.length - 1];
        if (myDraft && myDraft.course_title) {
          let parsedChapters = [];
          try {
            parsedChapters =
              typeof myDraft.course_chapters === 'string'
                ? JSON.parse(myDraft.course_chapters)
                : myDraft.course_chapters;
          } catch {}
          this.setData({
            courseForm: {
              courseid: 0,
              title: myDraft.course_title || '',
              desc: myDraft.course_desc || '',
              paper_id: '',
              chapters:
                Array.isArray(parsedChapters) && parsedChapters.length > 0
                  ? parsedChapters
                  : this.data.courseForm.chapters,
            },
          });
        }
      }
    } catch {}
  },

  onCloseEditCourseModal() {
    this.setData({ showEditCourseModal: false });
  },

  onCourseFormInput(e: any) {
    const field = e.currentTarget.dataset.field;
    if (!field) return;
    this.setData({ [`courseForm.${field}`]: e.detail.value });
  },

  onChapterFieldInput(e: any) {
    const idx = Number(e.currentTarget.dataset.index);
    const field = e.currentTarget.dataset.field;
    const chapters = [...(this.data.courseForm.chapters || [])];
    if (!chapters[idx] || !field) return;
    chapters[idx][field] = field === 'period' ? Number(e.detail.value || 7) : e.detail.value;
    this.setData({ 'courseForm.chapters': chapters });
  },

  onAddCourseChapter() {
    const chapters = [...(this.data.courseForm.chapters || [])];
    chapters.push({
      id: 0,
      serial: chapters.length + 1,
      title: `第${chapters.length + 1}章：进阶实践`,
      period: 7,
      url: '1',
      paper_id: '',
    });
    this.setData({ 'courseForm.chapters': chapters });
  },

  async onSaveCourseDraft() {
    const f = this.data.courseForm;
    if (!String(f.title || '').trim()) {
      wx.showToast({ title: '请先填写课程名称', icon: 'none' });
      return;
    }
    try {
      await base.post('/api/learn/save_draft', {
        title: f.title.trim(),
        desc: (f.desc || '').trim(),
        chapters: JSON.stringify(f.chapters || []),
      });
      wx.showToast({ title: '💾 课程草稿已保存', icon: 'none' });
    } catch {
      wx.showToast({ title: '草稿保存失败', icon: 'none' });
    }
  },

  async onSubmitSaveCourse() {
    if (this.data.savingCourse) return;
    const f = this.data.courseForm;
    if (!String(f.title || '').trim()) {
      wx.showToast({ title: '请填写课程名称', icon: 'none' });
      return;
    }
    if (!Array.isArray(f.chapters) || f.chapters.length === 0) {
      wx.showToast({ title: '请至少添加 1 个章节', icon: 'none' });
      return;
    }
    this.setData({ savingCourse: true });
    try {
      await base.post('/api/learn/save_course', {
        courseid: Number(f.courseid || 0),
        title: f.title.trim(),
        desc: (f.desc || '自塾共创精品课').trim(),
        paper_id: String(f.paper_id || ''),
        chapters: JSON.stringify(f.chapters),
      });
      wx.showToast({ title: '🎉 课程已成功发布！', icon: 'success' });
      this.setData({ showEditCourseModal: false });
      this.loadData();
    } catch {
      wx.showToast({ title: '发布失败，请稍后重试', icon: 'none' });
    } finally {
      this.setData({ savingCourse: false });
    }
  },
});
