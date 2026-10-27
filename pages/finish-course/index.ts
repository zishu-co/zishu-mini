// @ts-nocheck
/**
 * pages/finish-course/index.ts
 * 课程完成页（移植自 Vue3 FinishCourse.vue）
 * spec: specs/miniprogram/active/001-port-finish-course.md
 */
import {
  getFinishCourseInfo,
  confirmFinishCourse,
  submitHomework,
  FinishCourseInfo,
} from '../../services/learn/learn';

interface IPageData {
  loading: boolean;
  confirmLoading: boolean;
  submitting: boolean;
  hwLoading: boolean;
  courseInfo: Partial<FinishCourseInfo> & { homework_url?: string };
  quizScoreClass: string;
  quizStatusText: string;
  homeworkUrl: string;
  currentDate: string;
}

Page<IPageData, IPageData>({
  data: {
    loading: false,
    confirmLoading: false,
    submitting: false,
    hwLoading: false,
    courseInfo: {
      course_id: 0,
      course_title: '',
      user_name: '',
      is_ark_learning: false,
      ark_info: null,
      quiz_info: null,
      paper_id: null,
    },
    quizScoreClass: '',
    quizStatusText: '',
    homeworkUrl: '',
    currentDate: '',
  },

  courseId: 0,

  onLoad(options: any) {
    this.courseId = parseInt(options.course_id || '0', 10);
    if (!this.courseId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    this.setData({
      courseInfo: { ...this.data.courseInfo, course_id: this.courseId },
      currentDate: this.formatDate(new Date()),
    });
    this.loadData();
  },

  onShow() {
    if (this.courseId && this.data.courseInfo.course_title) {
      this.loadData();
    }
  },

  formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${year}年${month}月${day}日`;
  },

  loadData() {
    return this.loadFinishInfo();
  },

  async loadFinishInfo() {
    this.setData({ loading: true });
    try {
      const res = await getFinishCourseInfo(this.courseId);
      if (res && res.code === '200') {
        const mergedInfo = {
          ...this.data.courseInfo,
          ...res,
          ark_info: res.ark_info || (res.is_ark_learning ? { ark_id: 0, arkname: '', captain_id: 0, homework_url: '' } : null),
        };
        const q = mergedInfo.quiz_info;
        const quizScoreClass = !q ? '' : !q.has_taken ? 'score-none' : q.is_full_score ? 'score-full' : 'score-partial';
        const quizStatusText = !q ? '' : !q.has_taken ? '未作答' : q.is_full_score ? '满分通过' : '未达满分';
        this.setData({
          courseInfo: mergedInfo,
          quizScoreClass,
          quizStatusText,
        });
      } else {
        wx.showToast({ title: '获取结课信息失败', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
      }
    } catch (e) {
      console.error('[finish-course] loadFinishInfo error:', e);
      wx.showToast({ title: '加载失败，请返回重试', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    } finally {
      this.setData({ loading: false });
    }
  },

  goQuiz() {
    const paperId = this.data.courseInfo.paper_id;
    if (!paperId) {
      wx.showToast({ title: '该课程暂无结课测验', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: `/pages/test/test?testid=${paperId}` });
  },

  onHomeworkInput(e: any) {
    this.setData({ homeworkUrl: e.detail.value });
  },

  async submitHomework() {
    if (this.data.hwLoading) return;
    const url = this.data.homeworkUrl.trim();
    if (!url) {
      wx.showToast({ title: '请先填写作业链接', icon: 'none' });
      return;
    }
    this.setData({ hwLoading: true });
    try {
      await submitHomework(this.courseId, url);
      // 本地更新 ark_info
      const arkInfo = this.data.courseInfo.ark_info || {};
      arkInfo.homework_url = url;
      this.setData({
        'courseInfo.ark_info': arkInfo,
        homeworkUrl: '',
      });
      wx.showToast({ title: '作业链接已提交，等待舟长审批', icon: 'success' });
    } catch (e) {
      console.error('[finish-course] submitHomework error:', e);
      wx.showToast({ title: '提交失败', icon: 'none' });
    } finally {
      this.setData({ hwLoading: false });
    }
  },

  async confirmFinish() {
    if (this.data.confirmLoading || this.data.submitting) return;
    this.setData({ confirmLoading: true, submitting: true });
    try {
      const res = await confirmFinishCourse(this.courseId);
      if (res && res.code === '200') {
        wx.showToast({ title: '结课成功！', icon: 'success' });
        setTimeout(() => {
          wx.switchTab({ url: '/pages/learn/index' });
        }, 1200);
      } else {
        wx.showToast({ title: res?.message || '结课失败，请重试', icon: 'none' });
      }
    } catch (e) {
      console.error('[finish-course] confirmFinish error:', e);
      wx.showToast({ title: '结课失败，请重试', icon: 'none' });
    } finally {
      this.setData({ confirmLoading: false, submitting: false });
    }
  },

  downloadCertificate() {
    wx.showToast({ title: '证书下载功能正在开发中...', icon: 'none' });
  },

  // 阻止作业链接点击穿透
  stopPropagation() {},
});
