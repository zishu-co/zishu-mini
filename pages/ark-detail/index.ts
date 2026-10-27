// @ts-nocheck
/**
 * pages/ark-detail/index.ts
 * 方舟详情：2男2女搭子舱 / 船员进度PK / 三会排期 / 互动管理
 * spec: specs/miniprogram/active/004-complete-ark-detail.md
 */
import {
  arkDetail,
  arkSetCaptain,
  arkSaveMeetings,
  arkGetMeetings,
  arkClose,
  arkLeave,
  arkReportHour,
  arkSubmitQuiz,
  arkFinishAllCrews,
  arkKickCrew,
  arkDeleteEmpty,
  ArkDetail,
  ArkDetailMember,
} from '../../services/learn/learn';
import { quickGreetPeer } from '../../services/user/user';

const app = getApp<any>();

interface IPageData {
  arkId: number;
  loading: boolean;
  submitting: boolean;
  ark: Partial<ArkDetail>;
  courseTitle: string;
  currentUserId: number;
  isCaptain: boolean;
  isTeacher: boolean;
  isMember: boolean;
  stageClass: string;
  canSelfSetCaptain: boolean;
  canEditMeetings: boolean;
  canCloseArk: boolean;
  canLeaveArk: boolean;
  hasMeetings: boolean;
  maleCount: number;
  femaleCount: number;
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
    submitting: false,
    ark: {},
    courseTitle: '',
    currentUserId: 0,
    isCaptain: false,
    isTeacher: false,
    isMember: false,
    stageClass: 'badge-waiting',
    canSelfSetCaptain: false,
    canEditMeetings: false,
    canCloseArk: false,
    canLeaveArk: false,
    canFinishAllCrews: false,
    canDeleteEmptyArk: false,
    hasMeetings: false,
    maleCount: 0,
    femaleCount: 0,
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
    this.setData({ arkId: parseInt(options.arkId || options.id || '0', 10) });
    this.loadUserInfo();
    if (this.data.arkId) {
      this.loadData();
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },

  onShareAppMessage() {
    const arkName = this.data.ark?.arkname || '诺亚方舟共学舱';
    return {
      title: `🚢 邀请你加入自塾「${arkName}」2男2女共学搭子舱！`,
      path: `/pages/ark-detail/index?arkId=${this.data.arkId}`,
    };
  },

  loadUserInfo() {
    const userInfo = app.globalData?.userInfo || wx.getStorageSync('userInfo') || {};
    this.setData({
      currentUserId: Number(userInfo.userId || userInfo.id || wx.getStorageSync('userId') || 0),
    });
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const res: any = await arkDetail(this.data.arkId);
      const rawMembers = Array.isArray(res?.members) ? res.members : [];
      const members = rawMembers.map((m: ArkDetailMember) => ({
        ...m,
        _genderClass: this.genderClass(m.gender),
        _progressPercent: Math.min(100, Math.max(0, Number(m.progress_percent) || 0)),
      }));
      const maleCount = members.filter((m: any) => m.gender === '男').length;
      const femaleCount = members.filter((m: any) => m.gender === '女').length;

      const ark: ArkDetail = {
        ...this.data.ark,
        ...res,
        members,
      };
      const myUserId = this.data.currentUserId;
      const isCaptain = Number(ark.captain_id) === myUserId && ark.stage === '已成舟';
      const isTeacher = Number(ark.teacher_id) === myUserId;
      const isMember = !!members.find((m: ArkDetailMember) => Number(m.user_id) === myUserId);

      const stageClass = this.stageClass(ark.stage);
      const canSelfSetCaptain = this.computeCanSelfSetCaptain(ark, isMember, isCaptain, isTeacher);
      const canEditMeetings = this.computeCanEditMeetings(ark, isCaptain, isTeacher);
      const canCloseArk = this.computeCanCloseArk(ark, isCaptain, isTeacher);
      const canLeaveArk = this.computeCanLeaveArk(ark, isMember, isCaptain, isTeacher);
      const canFinishAllCrews = Boolean(
        (isCaptain || isTeacher) &&
          !ark.finished &&
          !ark.closed &&
          Number(ark.total_progress_percent || 0) >= 100
      );
      const canDeleteEmptyArk = Boolean(
        isTeacher && !ark.finished && !ark.closed && members.length === 0
      );
      const hasMeetings = Boolean(
        ark.meet_start ||
          ark.meet_mid ||
          ark.meet_end ||
          ark.meet_start_time ||
          ark.meet_mid_time ||
          ark.meet_end_time
      );

      this.setData({
        ark,
        isCaptain,
        isTeacher,
        isMember,
        stageClass,
        canSelfSetCaptain,
        canEditMeetings,
        canCloseArk,
        canLeaveArk,
        canFinishAllCrews,
        canDeleteEmptyArk,
        hasMeetings,
        maleCount,
        femaleCount,
        meetingsForm: {
          meet_start: ark.meet_start || '',
          meet_start_time: ark.meet_start_time || '',
          meet_mid: ark.meet_mid || '',
          meet_mid_time: ark.meet_mid_time || '',
          meet_end: ark.meet_end || '',
          meet_end_time: ark.meet_end_time || '',
        },
      });
    } catch (e) {
      console.error('[ark-detail] loadData error:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  computeCanSelfSetCaptain(
    ark: Partial<ArkDetail>,
    isMember: boolean,
    isCaptain: boolean,
    isTeacher: boolean
  ): boolean {
    if (!isMember || isCaptain || isTeacher) return false;
    if (ark.closed || ark.finished) return false;
    if (ark.captain_id && ark.stage === '已成舟') return false;
    return true;
  },

  computeCanCloseArk(
    ark: Partial<ArkDetail>,
    isCaptain: boolean,
    isTeacher: boolean
  ): boolean {
    if (!isCaptain && !isTeacher) return false;
    if (ark.finished || ark.closed) return false;
    if (!ark.all_meetings_done) return false;
    return true;
  },

  computeCanLeaveArk(
    ark: Partial<ArkDetail>,
    isMember: boolean,
    isCaptain: boolean,
    isTeacher: boolean
  ): boolean {
    if (!isMember || isCaptain || isTeacher) return false;
    if (ark.finished || ark.closed) return false;
    return true;
  },

  computeCanEditMeetings(
    ark: Partial<ArkDetail>,
    isCaptain: boolean,
    isTeacher: boolean
  ): boolean {
    if (!isTeacher && !isCaptain) return false;
    if (ark.finished || ark.closed) return false;
    return true;
  },

  // ───────── 操作 ─────────

  async onSetCaptain() {
    if (this.data.submitting) return;
    this.setData({ submitting: true });
    try {
      const res: any = await arkSetCaptain(this.data.arkId);
      if (res?.code === 200) {
        wx.showToast({ title: '⭐ 恭喜成为舟长！方舟正式启航', icon: 'success' });
        await this.loadData();
      } else {
        wx.showToast({ title: res?.message || '操作失败', icon: 'none' });
      }
    } catch (err: any) {
      wx.showToast({ title: err?.message || '操作失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  async onOpenMeetings() {
    try {
      const m: any = await arkGetMeetings(this.data.arkId);
      this.setData({
        showMeetingsModal: true,
        meetingsForm: {
          meet_start: m?.meet_start || this.data.meetingsForm.meet_start || '',
          meet_start_time: m?.meet_start_time || this.data.meetingsForm.meet_start_time || '',
          meet_mid: m?.meet_mid || this.data.meetingsForm.meet_mid || '',
          meet_mid_time: m?.meet_mid_time || this.data.meetingsForm.meet_mid_time || '',
          meet_end: m?.meet_end || this.data.meetingsForm.meet_end || '',
          meet_end_time: m?.meet_end_time || this.data.meetingsForm.meet_end_time || '',
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
    if (this.data.submitting) return;
    this.setData({ submitting: true });
    try {
      const res: any = await arkSaveMeetings(this.data.arkId, this.data.meetingsForm);
      if (res?.code === 200) {
        wx.showToast({ title: '📅 三会信息已保存', icon: 'success' });
        this.setData({ showMeetingsModal: false });
        await this.loadData();
      } else {
        wx.showToast({ title: res?.message || '保存失败', icon: 'none' });
      }
    } catch (err: any) {
      wx.showToast({ title: err?.message || '保存失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  onCopyMeeting(e: any) {
    const code = e.currentTarget.dataset.code;
    if (!code) {
      wx.showToast({ title: '暂未填写会议号', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: String(code),
      success: () => {
        wx.showToast({ title: '已复制会议号/链接', icon: 'success' });
      },
    });
  },

  onCloseArk() {
    if (this.data.submitting) return;
    wx.showModal({
      title: '完结方舟',
      content: '确认完结方舟？三会必须全部完成方可操作。',
      success: async (res) => {
        if (!res.confirm) return;
        this.setData({ submitting: true });
        try {
          const r: any = await arkClose(this.data.arkId);
          if (r?.code === 200) {
            wx.showToast({ title: '🏆 方舟已圆满完结！', icon: 'success' });
            await this.loadData();
          } else {
            wx.showToast({ title: r?.message || '完结失败', icon: 'none' });
          }
        } catch (err: any) {
          wx.showToast({ title: err?.message || '完结失败', icon: 'none' });
        } finally {
          this.setData({ submitting: false });
        }
      },
    });
  },

  onLeaveArk() {
    if (this.data.submitting) return;
    wx.showModal({
      title: '退出方舟',
      content: '退出后若人数不足4人，方舟将自动关闭。确认退出？',
      success: async (res) => {
        if (!res.confirm) return;
        this.setData({ submitting: true });
        try {
          const r: any = await arkLeave(this.data.arkId);
          if (r?.code === 200) {
            wx.showToast({ title: '已退出方舟', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 800);
          } else {
            wx.showToast({ title: r?.message || '退出失败', icon: 'none' });
          }
        } catch (err: any) {
          wx.showToast({ title: err?.message || '退出失败', icon: 'none' });
        } finally {
          this.setData({ submitting: false });
        }
      },
    });
  },

  /** 跳某舟员学习单 */
  onGoLearnSheet(e: any) {
    const userId = e.currentTarget.dataset.userid;
    if (!userId) return;
    wx.navigateTo({ url: `/pages/learn-sheet/index?userId=${userId}` });
  },

  /** 方舟船员章节学时打卡推进 (POST /api/learn/ark/report_hour) */
  async onReportArkHour() {
    if (this.data.submitting) return;
    this.setData({ submitting: true });
    try {
      const res: any = await arkReportHour(this.data.arkId);
      if (res?.code === 200) {
        wx.showToast({
          title: `🎉 打卡成功！已推进至第 ${res.new_serial}/${res.total} 课`,
          icon: 'none',
        });
        await this.loadData();
      } else {
        wx.showToast({ title: res?.message || '推进失败', icon: 'none' });
      }
    } catch (err: any) {
      wx.showToast({ title: err?.message || '打卡失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  /** 舟长/塾师为全船 100% 成员统一结课 (POST /api/learn/ark/finish-all-crews) */
  onFinishAllCrews() {
    if (this.data.submitting) return;
    wx.showModal({
      title: '全舱统一结课',
      content: '确认全舱 4 名船员均已完成 100% 章节学习，并为全员统一办理结课吗？',
      success: async (res) => {
        if (!res.confirm) return;
        this.setData({ submitting: true });
        try {
          const r: any = await arkFinishAllCrews(this.data.arkId);
          if (r?.code === 200) {
            wx.showToast({ title: r?.message || '🎓 全船已统一结课！', icon: 'none' });
            await this.loadData();
          } else {
            wx.showToast({ title: r?.message || '尚有成员未学完', icon: 'none' });
          }
        } finally {
          this.setData({ submitting: false });
        }
      },
    });
  },

  /** 塾师移除未成舟成员 (DELETE /api/learn/ark/crew/{crew_id}) */
  onKickCrew(e: any) {
    const crewId = Number(e.currentTarget.dataset.crewid || 0);
    const username = e.currentTarget.dataset.username || '该成员';
    if (!crewId) return;
    wx.showModal({
      title: '调整方舟成员',
      content: `确认将 ${username} 移出当前筹建中的方舟吗？`,
      confirmColor: '#ef4444',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          const r: any = await arkKickCrew(crewId);
          if (r?.code === 200) {
            wx.showToast({ title: '已移除成员', icon: 'success' });
            await this.loadData();
          } else {
            wx.showToast({ title: r?.message || '移除失败', icon: 'none' });
          }
        } catch (err) {
          wx.showToast({ title: '移除失败', icon: 'none' });
        }
      },
    });
  },

  /** 塾师删除空方舟 (POST /api/learn/ark/delete) */
  onDeleteEmptyArk() {
    wx.showModal({
      title: '删除空方舟',
      content: '当前方舟内暂无船员，确认删除该方舟吗？',
      confirmColor: '#ef4444',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          const r: any = await arkDeleteEmpty(this.data.arkId);
          if (r?.code === 200) {
            wx.showToast({ title: '已删除空方舟', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 800);
          } else {
            wx.showToast({ title: r?.message || '删除失败', icon: 'none' });
          }
        } catch (err) {
          wx.showToast({ title: '删除失败', icon: 'none' });
        }
      },
    });
  },

  /** 一键向同舟搭子打招呼约学 */
  async onGreetMember(e: any) {
    const userId = Number(e.currentTarget.dataset.userid || 0);
    const username = e.currentTarget.dataset.username || '船员搭子';
    if (!userId || userId === this.data.currentUserId) {
      wx.showToast({ title: '这是你自己哦 😊', icon: 'none' });
      return;
    }
    try {
      const res: any = await quickGreetPeer({
        target_user_id: userId,
        topic: `《${this.data.ark.arkname || '诺亚方舟'}》同舟共学打卡约聊`,
        planed_duration: 15,
      });
      wx.showToast({
        title: res?.message || `已向 ${username} 发起共学约聊！`,
        icon: 'none',
      });
    } catch (err: any) {
      wx.showToast({
        title: `已向 ${username} 发送搭子招呼 👋`,
        icon: 'none',
      });
    }
  },

  stageClass(stage?: string): string {
    if (stage === '已成舟') return 'badge-success';
    return 'badge-waiting';
  },

  genderClass(g?: string): string {
    return g === '男' ? 'gender-male' : g === '女' ? 'gender-female' : '';
  },
});
