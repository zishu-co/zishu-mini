// @ts-nocheck
/**
 * pages/ark-detail/index.ts
 * 方舟详情：成员 / 进度 / 三会 / 管理操作
 * spec: specs/miniprogram/active/004-complete-ark-detail.md
 */
import {
  arkDetail,
  arkSetCaptain,
  arkSaveMeetings,
  arkGetMeetings,
  arkClose,
  arkLeave,
  ArkDetail,
  ArkDetailMember,
} from '../../services/learn/learn';

const app = getApp<any>();

interface IPageData {
  arkId: number;
  loading: boolean;
  ark: Partial<ArkDetail>;
  captainName: string;
  courseTitle: string;
  currentUserId: number;
  isCaptain: boolean;
  isTeacher: boolean;
  isMember: boolean;
  showMeetingsModal: boolean;
  meetingsForm: {
    meet_start: string;
    meet_start_time: string;
    meet_mid: string;
    meet_mid_time: string;
    meet_end: string;
    meet_end_time: string;
  };
}

Page<IPageData, IPageData>({
  data: {
    arkId: 0,
    loading: true,
    ark: {},
    captainName: '',
    courseTitle: '',
    currentUserId: 0,
    isCaptain: false,
    isTeacher: false,
    isMember: false,
    showMeetingsModal: false,
    meetingsForm: {
      meet_start: '',
      meet_start_time: '',
      meet_mid: '',
      meet_mid_time: '',
      meet_end: '',
      meet_end_time: '',
    },
  },

  onLoad(options: any) {
    this.setData({ arkId: parseInt(options.arkId || '0', 10) });
    this.loadUserInfo();
    if (this.data.arkId) {
      this.loadData();
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  loadUserInfo() {
    const userInfo = app.globalData?.userInfo || wx.getStorageSync('userInfo') || {};
    this.setData({ currentUserId: userInfo.userId || 0 });
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const res: any = await arkDetail(this.data.arkId);
      const ark: ArkDetail = { ...this.data.ark, ...res };
      const myUserId = this.data.currentUserId;
      const isCaptain = ark.captain_id === myUserId && ark.stage === '已成舟';
      const isTeacher = ark.teacher_id === myUserId;
      const isMember = !!ark.members?.find((m: ArkDetailMember) => m.user_id === myUserId);
      // 从成员列表中找出舟长的名字
      const captain = ark.members?.find((m: ArkDetailMember) => m.is_captain);
      const captainName = captain?.username || '';
      this.setData({ ark, captainName, isCaptain, isTeacher, isMember });
    } catch (e) {
      console.error('[ark-detail] loadData error:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  /** 我能"设我为舟长"吗？（成员 + 筹建中 + 无舟长） */
  canSelfSetCaptain(): boolean {
    const { ark, isMember, isCaptain, isTeacher } = this.data;
    if (!isMember || isCaptain || isTeacher) return false;
    if (!ark.captain_id && ark.stage === '已成舟') return false; // 已有舟长
    return true;
  },

  /** 完结方舟：舟长 + 三会全部完成 + 未完结 */
  canCloseArk(): boolean {
    const { ark, isCaptain, isTeacher } = this.data;
    if (!isCaptain && !isTeacher) return false;
    if (ark.finished) return false;
    if (!ark.all_meetings_done) return false;
    return true;
  },

  /** 退出方舟：成员 + 不是舟长 + 未完结 */
  canLeaveArk(): boolean {
    const { ark, isMember, isCaptain, isTeacher } = this.data;
    if (!isMember || isCaptain || isTeacher) return false;
    if (ark.finished) return false;
    return true;
  },

  /** 编辑三会：塾师或舟长 + 未完结 */
  canEditMeetings(): boolean {
    const { ark, isCaptain, isTeacher } = this.data;
    if (!isTeacher && !isCaptain) return false;
    if (ark.finished) return false;
    return true;
  },

  // ───────── 操作 ─────────

  async onSetCaptain() {
    try {
      const res: any = await arkSetCaptain(this.data.arkId);
      if (res?.code === 200) {
        wx.showToast({ title: '恭喜成为舟长！方舟名已确定', icon: 'success' });
        await this.loadData();
      } else {
        wx.showToast({ title: res?.message || '操作失败', icon: 'none' });
      }
    } catch (err: any) {
      wx.showToast({ title: err?.message || '操作失败', icon: 'none' });
    }
  },

  async onOpenMeetings() {
    try {
      const m: any = await arkGetMeetings(this.data.arkId);
      this.setData({
        showMeetingsModal: true,
        meetingsForm: {
          meet_start: m?.meet_start || '',
          meet_start_time: m?.meet_start_time || '',
          meet_mid: m?.meet_mid || '',
          meet_mid_time: m?.meet_mid_time || '',
          meet_end: m?.meet_end || '',
          meet_end_time: m?.meet_end_time || '',
        },
      });
    } catch (e) {
      this.setData({ showMeetingsModal: true });
    }
  },

  onMeetingsInput(e: any) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`meetingsForm.${field}`]: e.detail.value });
  },

  onCloseMeetings() {
    this.setData({ showMeetingsModal: false });
  },

  async onSaveMeetings() {
    try {
      const res: any = await arkSaveMeetings(this.data.arkId, this.data.meetingsForm);
      if (res?.code === 200) {
        wx.showToast({ title: '三会信息已保存', icon: 'success' });
        this.setData({ showMeetingsModal: false });
        await this.loadData();
      } else {
        wx.showToast({ title: res?.message || '保存失败', icon: 'none' });
      }
    } catch (err: any) {
      wx.showToast({ title: err?.message || '保存失败', icon: 'none' });
    }
  },

  onCloseArk() {
    wx.showModal({
      title: '完结方舟',
      content: '确认完结方舟？三会必须全部完成方可操作。',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          const r: any = await arkClose(this.data.arkId);
          if (r?.code === 200) {
            wx.showToast({ title: '方舟已完结！', icon: 'success' });
            await this.loadData();
          } else {
            wx.showToast({ title: r?.message || '完结失败', icon: 'none' });
          }
        } catch (err: any) {
          wx.showToast({ title: err?.message || '完结失败', icon: 'none' });
        }
      },
    });
  },

  onLeaveArk() {
    wx.showModal({
      title: '退出方舟',
      content: '退出方舟不退押金，信用记录将记载退出经历，请谨慎决策。确定退出？',
      confirmText: '确认退出',
      confirmColor: '#fa4126',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          const r: any = await arkLeave(this.data.arkId);
          if (r?.code === 200) {
            wx.showToast({ title: '已退出方舟', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 1000);
          } else {
            wx.showToast({ title: r?.message || '退出失败', icon: 'none' });
          }
        } catch (err: any) {
          wx.showToast({ title: err?.message || '退出失败', icon: 'none' });
        }
      },
    });
  },

  onGoLearnSheet(e: any) {
    const userId = e.currentTarget.dataset.userid;
    if (!userId) return;
    wx.navigateTo({ url: `/pages/learn-sheet/index?userId=${userId}` });
  },

  genderClass(g: string | null): string {
    return g === '男' ? 'gender-male' : g === '女' ? 'gender-female' : '';
  },

  stageClass(stage: string): string {
    return stage === '已成舟' ? 'badge-success' : 'badge-waiting';
  },
});
