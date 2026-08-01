// @ts-nocheck
/**
 * pages/ark-group/index.ts
 * 组方舟页面：列方舟 / 加入 / 创建
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

  loadUserInfo() {
    const userInfo = app.globalData?.userInfo || wx.getStorageSync('userInfo') || {};
    const gender = userInfo.gender || null;
    console.log('[ark-group] loadUserInfo userId:', userInfo.userId, 'gender:', gender, 'userInfo keys:', Object.keys(userInfo));
    this.setData({
      currentUserId: userInfo.userId || 0,
      currentGender: gender,
    });
  },

  async loadData() {
    this.setData({ loading: true });

    // 先拉我已加入的方舟，确保判断 isMyArk 时 myArkId 已就绪
    let myArkId: number | null = null;
    try {
      const my: any = await arkMy();
      if (my && my.ark_id) {
        myArkId = my.ark_id;
      }
    } catch (e) {
      // 404 = 不在任何方舟中，正常情况
    }

    try {
      const list = await arkListByTeacher(this.data.courseId);
      const safeList = Array.isArray(list) ? list : [];
      // 预计算每个方舟的状态字段，避免 WXML 方法调用求值不确定性
      const processedList = safeList.map(ark => {
        const canJoin = this.calcCanJoin(ark, myArkId);
        console.log('[ark-group] ark:', ark.teacher_name, 'ark_id:', ark.ark_id,
          'male:', ark.male_count, 'female:', ark.female_count,
          'closed:', ark.closed, 'finished:', ark.finished,
          'canJoin:', canJoin, 'isMyArk:', !!ark.ark_id && ark.ark_id === myArkId);
        return {
          ...ark,
          _canJoin: canJoin,
          _isMyArk: !!ark.ark_id && ark.ark_id === myArkId,
        };
      });
      this.setData({ arkList: processedList, myArkId });
    } catch (e) {
      console.error('[ark-group] loadData error:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  /** 判断是否可加入（已加入的方舟不可再加入） */
  calcCanJoin(ark: TeacherArkItem, myArkId: number | null = null): boolean {
    if (!ark.ark_id) return false;
    // 已在其中，不可再加入
    if (myArkId != null && ark.ark_id === myArkId) return false;
    if (typeof ark.closed === 'number' ? ark.closed !== 0 : !!ark.closed) return false;
    if (typeof ark.finished === 'number' ? ark.finished !== 0 : !!ark.finished) return false;
    const g = this.data.currentGender;
    if (g === '男') return ark.male_count < 2;
    if (g === '女') return ark.female_count < 2;
    // 性别未知时，按总人数判断（最多 4 人）
    return (ark.male_count + ark.female_count) < 4;
  },

  /** 模板中调用，直接从预计算字段读取 */
  canJoin(ark: TeacherArkItem): boolean {
    return !!(ark as any)._canJoin;
  },

  /** 是否已加入该方舟 */
  isMyArk(ark: TeacherArkItem): boolean {
    return !!ark.ark_id && ark.ark_id === this.data.myArkId;
  },

  async onJoinArk(e: any) {
    const arkId = e.currentTarget.dataset.arkid;
    if (!arkId) {
      wx.showToast({ title: '该塾师尚未创建方舟', icon: 'none' });
      return;
    }
    this.setData({ joiningArkId: arkId });
    try {
      const res: any = await arkJoin(arkId);
      if (res?.code === 200) {
        wx.showToast({ title: '加入成功！', icon: 'success' });
        this.setData({ myArkId: arkId });
        await this.loadData();
      } else {
        wx.showToast({ title: res?.message || '加入失败', icon: 'none' });
      }
    } catch (err: any) {
      console.error('[ark-group] join error:', err);
      wx.showToast({ title: err?.message || '加入失败', icon: 'none' });
    } finally {
      this.setData({ joiningArkId: null });
    }
  },

  async onCreateArk(e: any) {
    const teacherId = e.currentTarget.dataset.teacherid;
    if (this.data.currentUserId !== teacherId) return;
    this.setData({ creating: true });
    try {
      const res: any = await arkCreate(this.data.courseId);
      if (res?.code === 200) {
        wx.showToast({ title: '方舟创建成功！', icon: 'success' });
        await this.loadData();
      } else {
        wx.showToast({ title: res?.message || '创建失败', icon: 'none' });
      }
    } catch (err: any) {
      console.error('[ark-group] create error:', err);
      wx.showToast({ title: err?.message || '创建失败', icon: 'none' });
    } finally {
      this.setData({ creating: false });
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
    if (ark.stage === '筹建中') return '筹建中';
    return ark.stage || '筹建中';
  },

  statusClass(ark: TeacherArkItem): string {
    if (ark.finished) return 'badge-success';
    return 'badge-waiting';
  },
});
