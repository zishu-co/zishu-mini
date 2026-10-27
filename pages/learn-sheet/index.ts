// @ts-nocheck
/**
 * pages/learn-sheet/index.ts
 * 学习单：训练营 + 其他课程
 * spec: specs/miniprogram/active/005-port-learn-sheet.md
 */
import { learnSheet, LearnSheetData } from '../../services/learn/learn';
import { quickGreetPeer } from '../../services/user/user';

interface IPageData {
  userId: number;
  isSelf: boolean;
  ownerName: string;
  activeTab: 'all' | 'camps' | 'learning' | 'learned';
  campCount: number;
  learningCount: number;
  learnedCount: number;
  completionRate: number;
  isEmpty: boolean;
  loading: boolean;
  data: Partial<LearnSheetData>;
}

Page<IPageData, any>({
  data: {
    userId: 0,
    isSelf: true,
    ownerName: '同路人',
    activeTab: 'all',
    campCount: 0,
    learningCount: 0,
    learnedCount: 0,
    completionRate: 0,
    isEmpty: false,
    loading: true,
    data: {},
  },

  onLoad(options: any) {
    const targetId = parseInt(options.userId || '0', 10);
    const storedUser = wx.getStorageSync('userInfo') || {};
    const myId = Number(wx.getStorageSync('userId') || storedUser.userId || storedUser.id || 0);
    this.setData({
      userId: targetId,
      isSelf: !targetId || (myId > 0 && myId === targetId),
    });
    if (this.data.userId) {
      this.loadData();
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  onPullDownRefresh() {
    this.loadData().finally(() => wx.stopPullDownRefresh());
  },

  onShareAppMessage() {
    return {
      title: `📋 ${this.data.ownerName} 的自塾共学档案 · 结课完成率 ${this.data.completionRate}%`,
      path: `/pages/learn-sheet/index?userId=${this.data.userId}`,
    };
  },

  onTabChange(e: any) {
    const tab = e.currentTarget.dataset.tab as 'all' | 'camps' | 'learning' | 'learned';
    if (tab && tab !== this.data.activeTab) {
      this.setData({ activeTab: tab });
    }
  },

  onGoLearnCenter() {
    wx.switchTab({ url: '/pages/learn/index' });
  },

  decorateCourse(c: any) {
    return {
      ...c,
      _statusText: this.statusText(c),
      _statusClass: this.statusClass(c),
      _deadlineText: this.formatDate(c.deadline),
    };
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const res: any = await learnSheet(this.data.userId);
      let campCount = 0;
      let learningCount = 0;
      let learnedCount = 0;
      let totalCourseCount = 0;
      if (res) {
        if (Array.isArray(res.camps)) {
          campCount = res.camps.length;
          res.camps = res.camps.map((camp: any) => {
            const list = Array.isArray(camp.course_list)
              ? camp.course_list.map((c: any) => {
                  const dec = this.decorateCourse(c);
                  totalCourseCount += 1;
                  if (dec._statusClass === 'status-done') learnedCount += 1;
                  else if (dec._statusClass === 'status-learning') learningCount += 1;
                  return dec;
                })
              : [];
            return { ...camp, course_list: list };
          });
        }
        if (Array.isArray(res.other_learning)) {
          learningCount += res.other_learning.length;
          totalCourseCount += res.other_learning.length;
          res.other_learning = res.other_learning.map((c: any) => this.decorateCourse(c));
        }
        if (Array.isArray(res.other_learned)) {
          learnedCount += res.other_learned.length;
          totalCourseCount += res.other_learned.length;
          res.other_learned = res.other_learned.map((c: any) => this.decorateCourse(c));
        }
      }
      const denom = totalCourseCount || learningCount + learnedCount;
      const completionRate = denom > 0 ? Math.round((learnedCount * 100) / denom) : 0;
      const isEmpty =
        (!res?.camps || res.camps.length === 0) &&
        (!res?.other_learning || res.other_learning.length === 0) &&
        (!res?.other_learned || res.other_learned.length === 0);
      const userName = res?.camps?.[0]?.user_name || '同路人';
      this.setData({
        data: res || {},
        ownerName: userName,
        campCount,
        learningCount,
        learnedCount,
        completionRate,
        isEmpty,
      });
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

  async onGreetOwner() {
    if (!this.data.userId) return;
    try {
      const res: any = await quickGreetPeer({
        target_user_id: this.data.userId,
        topic: `看到你的学习单，想约你一起共学打卡交流！`,
        planed_duration: 15,
      });
      wx.showToast({
        title: res?.message || `👋 已向 ${this.data.ownerName} 发起共学邀约！`,
        icon: 'none',
      });
    } catch {
      wx.showToast({
        title: `👋 已向 ${this.data.ownerName} 发送共学问候`,
        icon: 'none',
      });
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
