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
  certNo: string;
  showCertModal: boolean;
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
    certNo: '',
    showCertModal: false,
  },

  courseId: 0,

  onLoad(options: any) {
    this.courseId = parseInt(
      options?.course_id || options?.courseId || options?.id || '0',
      10,
    );
    if (!this.courseId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    const now = new Date();
    const uid = wx.getStorageSync('userId') || wx.getStorageSync('userInfo')?.id || 108;
    const certNo = `ZS-${now.getFullYear()}-${String(this.courseId).padStart(3, '0')}-${String(uid).padStart(4, '0')}`;
    this.setData({
      courseInfo: { ...this.data.courseInfo, course_id: this.courseId },
      currentDate: this.formatDate(now),
      certNo,
    });
    this.loadData();
  },

  onShow() {
    if (this.courseId && this.data.courseInfo.course_title) {
      this.loadData();
    }
  },

  onPullDownRefresh() {
    this.loadData().finally(() => wx.stopPullDownRefresh());
  },

  onShareAppMessage() {
    const courseTitle = this.data.courseInfo?.course_title || '自塾共学课程';
    return {
      title: `🎓 我在自塾完成了《${courseTitle}》全部课程学习，荣获结课证书！`,
      path: `/pages/course-detail/index?id=${this.courseId}`,
    };
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
    this.setData({ showCertModal: true });
  },

  onCloseCertModal() {
    this.setData({ showCertModal: false });
  },

  onCopyCertInfo() {
    const userName = this.data.courseInfo?.user_name || '自塾学友';
    const courseTitle = this.data.courseInfo?.course_title || '自塾精品课';
    const certNo = this.data.certNo || 'ZS-2026-001';
    const text = `🏆【自塾荣誉结课喜报】\n学员：${userName}\n课程：《${courseTitle}》\n证书编号：${certNo}\n颁发日期：${this.data.currentDate}\n—— 学本领，上自塾，以终为始共学同行！`;
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '证书喜报已复制，快去分享吧', icon: 'none', duration: 2200 });
      },
    });
  },

  onSaveCertPoster() {
    const query = wx.createSelectorQuery();
    query
      .select('#certCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res?.[0]?.node;
        if (!canvas) {
          this.onCopyCertInfo();
          return;
        }
        const ctx = canvas.getContext('2d');
        const width = 600;
        const height = 800;
        canvas.width = width;
        canvas.height = height;

        // 证书背景与金边
        ctx.fillStyle = '#fdfaf2';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 8;
        ctx.strokeRect(24, 24, width - 48, height - 48);
        ctx.lineWidth = 2;
        ctx.strokeRect(36, 36, width - 72, height - 72);

        // 标题与正文
        ctx.fillStyle = '#8a6608';
        ctx.font = 'bold 38px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('自塾荣誉结课证书', width / 2, 130);

        ctx.fillStyle = '#a1802b';
        ctx.font = '18px sans-serif';
        ctx.fillText(`证书编号：${this.data.certNo}`, width / 2, 175);

        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 34px sans-serif';
        ctx.fillText(this.data.courseInfo?.user_name || '自塾学友', width / 2, 290);

        ctx.fillStyle = '#4b5563';
        ctx.font = '22px sans-serif';
        ctx.fillText('在自塾共学体系中完成以下课程全部章节学习：', width / 2, 355);

        ctx.fillStyle = '#6d28d9';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(`《${this.data.courseInfo?.course_title || '自塾课程'}》`, width / 2, 420);

        ctx.fillStyle = '#6b7280';
        ctx.font = '20px sans-serif';
        ctx.fillText('特发此证，以资鼓励。愿以终为始，知行合一。', width / 2, 500);

        // 印章与日期
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(width / 2 + 120, 630, 52, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('自塾共学', width / 2 + 120, 625);
        ctx.fillText('荣誉认证', width / 2 + 120, 648);

        ctx.fillStyle = '#374151';
        ctx.font = '20px sans-serif';
        ctx.fillText(`颁发日期：${this.data.currentDate}`, width / 2 - 80, 640);

        wx.canvasToTempFilePath({
          canvas,
          success: (tmp) => {
            wx.saveImageToPhotosAlbum({
              filePath: tmp.tempFilePath,
              success: () => {
                wx.showToast({ title: '证书已保存到手机相册', icon: 'success' });
              },
              fail: () => {
                wx.previewImage({ urls: [tmp.tempFilePath] });
              },
            });
          },
          fail: () => {
            this.onCopyCertInfo();
          },
        });
      });
  },

  onGoArkDetail() {
    const arkId = this.data.courseInfo?.ark_info?.ark_id;
    if (arkId) {
      wx.navigateTo({ url: `/pages/ark-detail/index?arkId=${arkId}&id=${arkId}` });
    } else {
      wx.navigateTo({ url: `/pages/ark-group/index?courseId=${this.courseId}` });
    }
  },

  // 复制已提交的作业链接
  stopPropagation() {
    const url = this.data.courseInfo?.ark_info?.homework_url;
    if (url) {
      wx.setClipboardData({
        data: url,
        success: () => wx.showToast({ title: '作业链接已复制', icon: 'success' }),
      });
    }
  },
});
