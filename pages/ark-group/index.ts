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

interface SeatSlot {
  id: string;
  seatLabel: string;
  genderType: 'male' | 'female';
  occupied: boolean;
  username: string;
  isCaptain: boolean;
  emptyText: string;
}

interface IPageData {
  courseId: number;
  loading: boolean;
  activeFilter: 'all' | 'open' | 'ready';
  arkList: TeacherArkItem[];
  filteredArkList: TeacherArkItem[];
  openArkCount: number;
  readyArkCount: number;
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
    activeFilter: 'all',
    arkList: [],
    filteredArkList: [],
    openArkCount: 0,
    readyArkCount: 0,
    myArkId: null,
    currentUserId: 0,
    currentGender: null,
    joiningArkId: null,
    creating: false,
    submitting: false,
  },

  hasLoadedOnce: false,

  onLoad(options: any) {
    this.setData({ courseId: parseInt(options.courseId || options.id || '0', 10) });
    this.loadUserInfo();
    if (this.data.courseId) {
      this.loadData().then(() => {
        this.hasLoadedOnce = true;
      });
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  onShow() {
    this.loadUserInfo();
    if (this.hasLoadedOnce && this.data.courseId) {
      this.loadData();
    }
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },

  onShareAppMessage() {
    return {
      title: '🚢 2男2女诺亚方舟共学搭子舱 · 黄金4人组队，一起闯关结课！',
      path: `/pages/ark-group/index?courseId=${this.data.courseId}`,
    };
  },

  loadUserInfo() {
    const userInfo = app.globalData?.userInfo || wx.getStorageSync('userInfo') || {};
    this.setData({
      currentUserId: Number(userInfo.userId || userInfo.id || wx.getStorageSync('userId') || 0),
      currentGender: userInfo.gender || null,
    });
  },

  onFilterChange(e: any) {
    const filter = e.currentTarget.dataset.filter as 'all' | 'open' | 'ready';
    if (!filter || filter === this.data.activeFilter) return;
    const filteredArkList = this.applyFilter(this.data.arkList, filter);
    this.setData({
      activeFilter: filter,
      filteredArkList,
    });
  },

  applyFilter(list: any[], filter: 'all' | 'open' | 'ready') {
    if (filter === 'open') {
      return list.filter((ark: any) => Boolean(ark.ark_id && !ark.closed && !ark.finished && ark.stage !== '已成舟'));
    }
    if (filter === 'ready') {
      return list.filter((ark: any) => Boolean(ark.ark_id && (ark.stage === '已成舟' || ark.finished)));
    }
    return list;
  },

  buildCabinSeats(members: any[]): SeatSlot[] {
    const safeMembers = Array.isArray(members) ? members : [];
    const males = safeMembers.filter((m) => m.gender === '男');
    const females = safeMembers.filter((m) => m.gender === '女');
    const others = safeMembers.filter((m) => m.gender !== '男' && m.gender !== '女');

    const pickMale = (idx: number) => males[idx] || others.shift() || null;
    const pickFemale = (idx: number) => females[idx] || others.shift() || null;

    const m1 = pickMale(0);
    const m2 = pickMale(1);
    const f1 = pickFemale(0);
    const f2 = pickFemale(1);

    return [
      {
        id: 'male-1',
        seatLabel: '♂ 男席 1',
        genderType: 'male',
        occupied: Boolean(m1),
        username: m1?.username || '',
        isCaptain: Boolean(m1?.is_captain),
        emptyText: '♂ 虚位以待',
      },
      {
        id: 'male-2',
        seatLabel: '♂ 男席 2',
        genderType: 'male',
        occupied: Boolean(m2),
        username: m2?.username || '',
        isCaptain: Boolean(m2?.is_captain),
        emptyText: '♂ 虚位以待',
      },
      {
        id: 'female-1',
        seatLabel: '♀ 女席 1',
        genderType: 'female',
        occupied: Boolean(f1),
        username: f1?.username || '',
        isCaptain: Boolean(f1?.is_captain),
        emptyText: '♀ 虚位以待',
      },
      {
        id: 'female-2',
        seatLabel: '♀ 女席 2',
        genderType: 'female',
        occupied: Boolean(f2),
        username: f2?.username || '',
        isCaptain: Boolean(f2?.is_captain),
        emptyText: '♀ 虚位以待',
      },
    ];
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
    const openArkCount = decorated.filter(
      (a: any) => Boolean(a.ark_id && !a.closed && !a.finished && a.stage !== '已成舟')
    ).length;
    const readyArkCount = decorated.filter(
      (a: any) => Boolean(a.ark_id && (a.stage === '已成舟' || a.finished))
    ).length;
    const filteredArkList = this.applyFilter(decorated, this.data.activeFilter);

    this.setData({
      arkList: decorated,
      filteredArkList,
      openArkCount,
      readyArkCount,
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
      const teacherName = (ark.teacher_name || '师').trim();
      return {
        ...ark,
        members,
        _teacherInitial: teacherName ? teacherName.charAt(0) : '师',
        _seats: this.buildCabinSeats(members),
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
