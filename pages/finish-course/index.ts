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
  hwLoading: boolean;
  courseInfo: Partial<FinishCourseInfo> & { homework_url?: string };
  homeworkUrl: string;
  currentDate: string;
}

Page<IPageData, IPageData>({
  data: {
    loading: false,
    confirmLoading: false,
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
    this.loadFinishInfo();
  },

  formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${year}年${month}月${day}日`;
  },

  async loadFinishInfo() {
    this.setData({ loading: true });
    try {
      const res = await getFinishCourseInfo(this.courseId);
      if (res && res.code === '200') {
        this.setData({ courseInfo: { ...this.data.courseInfo, ...res } });
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

  // 测验成绩样式类
  quizScoreClass(): string {
    const q = this.data.courseInfo.quiz_info;
    if (!q) return '';
    if (!q.has_taken) return 'score-none';
    if (q.is_full_score) return 'score-full';
    return 'score-partial';
  },

  quizStatusText(): string {
    const q = this.data.courseInfo.quiz_info;
    if (!q) return '';
    if (!q.has_taken) return '未作答';
    if (q.is_full_score) return '满分通过';
    return '未达满分';
  },

  goQuiz() {
    const paperId = this.data.courseInfo.paper_id;
    if (!paperId) {
      wx.showToast({ title: '该课程暂无结课测验', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: `/pages/exam/index?id=${paperId}` });
  },

  onHomeworkInput(e: any) {
    this.setData({ homeworkUrl: e.detail.value });
  },

  async submitHomework() {
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
    this.setData({ confirmLoading: true });
    try {
      const res = await confirmFinishCourse(this.courseId);
      if (res && res.code === '200') {
        wx.showToast({ title: '结课成功！', icon: 'success' });
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/learn/index' });
        }, 1200);
      } else {
        wx.showToast({ title: res?.message || '结课失败，请重试', icon: 'none' });
      }
    } catch (e) {
      console.error('[finish-course] confirmFinish error:', e);
      wx.showToast({ title: '结课失败，请重试', icon: 'none' });
    } finally {
      this.setData({ confirmLoading: false });
    }
  },

  downloadCertificate() {
    wx.showToast({ title: '证书下载功能正在开发中...', icon: 'none' });
  },

  // 阻止作业链接点击穿透
  stopPropagation() {},

  onShareAppMessage() {
    const title = this.data.courseInfo?.course_title || '课程结课';
    return {
      title,
      path: `/pages/finish-course/index?course_id=${this.courseId}`,
    };
  },

  onShareTimeline() {
    const title = this.data.courseInfo?.course_title || '课程结课';
    return { title, query: `course_id=${this.courseId}` };
  },
});
