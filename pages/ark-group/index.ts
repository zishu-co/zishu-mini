// @ts-nocheck
/**
 * pages/ark-group/index.ts
 * 组方舟页面：2男2女黄金共学搭子舱 · 列方舟 / 加入 / 创建
 * spec: specs/miniprogram/active/003-complete-ark-group.md
 */
import {
  arkListByTeacher,
  arkMy,
  arkJoin,
  arkCreate,
  TeacherArkItem,
} from '../../services/learn/learn';

const app = getApp<any>();

interface IPageData {
  courseId: number;
  loading: boolean;
  arkList: TeacherArkItem[];
  myArkId: number | null;
  currentUserId: number;
  currentGender: string | null;
  joiningArkId: number | null;
  creating: boolean;
  submitting: boolean;
}

Page<IPageData, IPageData>({
  data: {
    courseId: 0,
    loading: true,
    arkList: [],
    myArkId: null,
    currentUserId: 0,
    currentGender: null,
    joiningArkId: null,
    creating: false,
    submitting: false,
  },

  onLoad(options: any) {
    this.setData({ courseId: parseInt(options.courseId || '0', 10) });
    this.loadUserInfo();
    if (this.data.courseId) {
      this.loadData();
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },

  loadUserInfo() {
    const userInfo = app.globalData?.userInfo || wx.getStorageSync('userInfo') || {};
    this.setData({
      currentUserId: Number(userInfo.userId || userInfo.id || wx.getStorageSync('userId') || 0),
      currentGender: userInfo.gender || null,
    });
  },

  async loadData() {
    this.setData({ loading: true });
    let rawList: TeacherArkItem[] = [];
    let myArkId: number | null = this.data.myArkId;

    try {
      const [listRes, myRes] = await Promise.all([
        arkListByTeacher(this.data.courseId).catch(() => []),
        arkMy().catch(() => null),
      ]);
      rawList = Array.isArray(listRes) ? listRes : [];
      myArkId = myRes && myRes.ark_id ? Number(myRes.ark_id) : null;
    } catch (e) {
      console.error('[ark-group] loadData error:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }

    const decorated = this.decorateArkList(rawList, myArkId);
    this.setData({
      arkList: decorated,
      myArkId,
      loading: false,
    });
  },

  decorateArkList(list: TeacherArkItem[], myArkId: number | null) {
    return (list || []).map((ark: any) => {
      const members = Array.isArray(ark.members)
        ? ark.members.map((m: any) => ({
            ...m,
            _genderClass: this.genderClass(m.gender),
          }))
        : [];
      const isMyArk = !!ark.ark_id && Number(ark.ark_id) === Number(myArkId);
      return {
        ...ark,
        members,
        _isMyArk: isMyArk,
        _canJoin: !isMyArk && this.canJoin(ark),
        _statusText: this.statusText(ark),
        _statusClass: this.statusClass(ark),
      };
    });
  },

  /** 是否能加入该方舟（2男2女黄金配比校验） */
  canJoin(ark: TeacherArkItem): boolean {
    if (!ark.ark_id || ark.closed || ark.finished) return false;
    const g = this.data.currentGender;
    if (g === '男') return (ark.male_count || 0) < 2;
    if (g === '女') return (ark.female_count || 0) < 2;
    // 未设置性别时允许点击并在服务端提示完善性别或按余量判断
    return (ark.male_count || 0) + (ark.female_count || 0) < 4;
  },

  /** 是否已加入该方舟 */
  isMyArk(ark: TeacherArkItem): boolean {
    return !!ark.ark_id && ark.ark_id === this.data.myArkId;
  },

  async onJoinArk(e: any) {
    if (this.data.submitting) return;
    const arkId = e.currentTarget.dataset.arkid;
    if (!arkId) {
      wx.showToast({ title: '该塾师尚未创建方舟', icon: 'none' });
      return;
    }
    this.setData({ joiningArkId: arkId, submitting: true });
    try {
      const res: any = await arkJoin(arkId);
      if (res?.code === 200) {
        wx.showToast({ title: '🎉 登船成功！快认识新搭子吧', icon: 'success' });
        this.setData({ myArkId: arkId });
        await this.loadData();
      } else {
        wx.showToast({ title: res?.message || '加入失败', icon: 'none' });
      }
    } catch (err: any) {
      console.error('[ark-group] join error:', err);
      wx.showToast({ title: err?.message || '加入失败', icon: 'none' });
    } finally {
      this.setData({ joiningArkId: null, submitting: false });
    }
  },

  async onCreateArk(e: any) {
    if (this.data.submitting) return;
    const teacherId = e.currentTarget.dataset.teacherid;
    if (this.data.currentUserId !== teacherId) return;
    this.setData({ creating: true, submitting: true });
    try {
      const res: any = await arkCreate(this.data.courseId);
      if (res?.code === 200) {
        wx.showToast({ title: '🚢 方舟创建成功！', icon: 'success' });
        await this.loadData();
      } else {
        wx.showToast({ title: res?.message || '创建失败', icon: 'none' });
      }
    } catch (err: any) {
      console.error('[ark-group] create error:', err);
      wx.showToast({ title: err?.message || '创建失败', icon: 'none' });
    } finally {
      this.setData({ creating: false, submitting: false });
    }
  },

  /** 跳方舟详情 */
  onGoDetail(e: any) {
    const arkId = e.currentTarget.dataset.arkid;
    if (!arkId) return;
    wx.navigateTo({ url: `/pages/ark-detail/index?arkId=${arkId}` });
  },

  /** 性别 chip class */
  genderClass(g: string | null): string {
    return g === '男' ? 'gender-male' : g === '女' ? 'gender-female' : '';
  },

  /** 状态徽章文本 */
  statusText(ark: TeacherArkItem): string {
    if (ark.finished) return '已成舟';
    if (ark.closed) return '已关闭';
    if (ark.stage === '筹建中') return '招募搭子中';
    return ark.stage || '招募搭子中';
  },

  statusClass(ark: TeacherArkItem): string {
    if (ark.finished || ark.stage === '已成舟') return 'badge-success';
    return 'badge-waiting';
  },
});
