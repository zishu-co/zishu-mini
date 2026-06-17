// @ts-nocheck
/**
 * pages/learn-sheet/index.ts
 * 学习单：训练营 + 其他课程
 * spec: specs/miniprogram/active/005-port-learn-sheet.md
 */
import { learnSheet, LearnSheetData } from '../../services/learn/learn';

interface IPageData {
  userId: number;
  loading: boolean;
  data: Partial<LearnSheetData>;
}

Page<IPageData, IPageData>({
  data: {
    userId: 0,
    loading: true,
    data: {},
  },

  onLoad(options: any) {
    this.setData({ userId: parseInt(options.userId || '0', 10) });
    if (this.data.userId) {
      this.loadData();
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const res: any = await learnSheet(this.data.userId);
      this.setData({ data: res });
      // 设置导航栏标题为用户名
      const userName = res?.camps?.[0]?.user_name || '';
      if (userName) {
        wx.setNavigationBarTitle({ title: `${userName} 的学习单` });
      }
    } catch (e) {
      console.error('[learn-sheet] loadData error:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onGoCourse(e: any) {
    const courseId = e.currentTarget.dataset.id;
    if (!courseId) return;
    wx.navigateTo({ url: `/pages/course-detail/index?id=${courseId}` });
  },

  /** 格式化日期 */
  formatDate(d: string | null): string {
    if (!d) return '—';
    try {
      return d.split('T')[0];
    } catch {
      return d;
    }
  },

  /** 状态：未开始 / 在学 / 已学完 */
  courseStatus(c: any): string {
    if (c.finish_time) return 'done';
    if (c.current_serial && c.create_time) return 'learning';
    return 'not-started';
  },

  statusText(c: any): string {
    const s = this.courseStatus(c);
    if (s === 'done') return '已学完';
    if (s === 'learning') return `第${c.current_serial}章`;
    return '未开始';
  },

  statusClass(c: any): string {
    const s = this.courseStatus(c);
    if (s === 'done') return 'status-done';
    if (s === 'learning') return 'status-learning';
    return 'status-not-started';
  },
});
