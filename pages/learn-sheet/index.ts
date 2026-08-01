// @ts-nocheck
/**
 * pages/learn-sheet/index.ts
 * 学习单：训练营 + 其他课程
 * spec: specs/miniprogram/active/005-port-learn-sheet.md
 */
import { learnSheet, LearnSheetData } from '../../services/learn/learn';
import { fetchCurrentSelections } from '../../services/course/course';

interface IPageData {
  userId: number;
  loading: boolean;
  data: Partial<LearnSheetData>;
  selMap: Record<number, any>;
}

Page<IPageData, IPageData>({
  data: {
    userId: 0,
    loading: true,
    data: {},
    selMap: {},
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
      // 并行请求：学习单数据 + 选课数据（含 chapter_title / deadline）
      const [res, selections]: [any, any[]] = await Promise.all([
        learnSheet(this.data.userId).catch(() => null),
        fetchCurrentSelections().catch(() => []),
      ]) as any;

      // 构建 course_id -> 选课详情的映射
      const selMap: Record<number, any> = {};
      if (Array.isArray(selections)) {
        selections.forEach((s: any) => {
          if (s.course_id) selMap[s.course_id] = s;
        });
      }

      // 用选课数据补全 other_learning 和 other_learned
      const enrich = (list: any[]) =>
        (list || []).map((c: any) => {
          const sel = selMap[c.course_id];
          return {
            ...c,
            chapter_title: c.chapter_title || sel?.chapter_title || null,
            deadline: c.deadline || sel?.deadline || null,
            current_serial: c.current_serial || sel?.current_serial || null,
          };
        });

      const enriched = res
        ? {
            ...res,
            other_learning: enrich(res.other_learning),
            other_learned: enrich(res.other_learned),
          }
        : null;

      this.setData({ data: enriched, selMap });

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

  onShareAppMessage() {
    return {
      title: '自塾·学习单',
      path: `/pages/learn-sheet/index?userId=${this.data.userId}`,
    };
  },

  onShareTimeline() {
    return { title: '自塾·学习单' };
  },
});
