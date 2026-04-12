// pages/aim/index.ts
import { fetchUserCenter, UserCenterData } from '../../services/aim/fetchUsercenter';

// Toast 使用 require 方式导入
const Toast = require('tdesign-miniprogram/toast/index').default;

interface MenuItem {
  title: string;
  tit: string | number;
  url: string;
  type: string;
  icon: string;
}

interface OrderTag {
  title: string;
  iconName: string;
  orderNum: number;
  tabType: number;
  status: number;
}

interface IAimData {
  showMakePhone: boolean;
  userInfo: {
    avatarUrl: string;
    nickName: string;
    phoneNumber: string;
  };
  menuData: MenuItem[][];
  orderTagInfos: OrderTag[];
  customerServiceInfo: {
    servicePhone?: string;
    serviceTimeDuration?: string;
  };
  currAuthStep: number;
  showKefu: boolean;
  versionNo: string;
}

const menuData: MenuItem[][] = [
  [
    { title: '收货地址', tit: '', url: '', type: 'address', icon: '' },
    { title: '优惠券', tit: '', url: '', type: 'coupon', icon: '' },
    { title: '积分', tit: '', url: '', type: 'point', icon: '' },
  ],
  [
    { title: '帮助中心', tit: '', url: '', type: 'help-center', icon: '' },
    { title: '客服热线', tit: '', url: '', type: 'service', icon: 'service' },
  ],
];

const orderTagInfos: OrderTag[] = [
  { title: '待付款', iconName: 'wallet', orderNum: 0, tabType: 5, status: 1 },
  { title: '待发货', iconName: 'deliver', orderNum: 0, tabType: 10, status: 1 },
  { title: '待收货', iconName: 'package', orderNum: 0, tabType: 40, status: 1 },
  { title: '待评价', iconName: 'comment', orderNum: 0, tabType: 60, status: 1 },
  { title: '退款/售后', iconName: 'exchang', orderNum: 0, tabType: 0, status: 1 },
];

const getDefaultData = (): IAimData => ({
  showMakePhone: false,
  userInfo: {
    avatarUrl: '',
    nickName: '正在登录...',
    phoneNumber: '',
  },
  menuData,
  orderTagInfos,
  customerServiceInfo: {},
  currAuthStep: 1,
  showKefu: true,
  versionNo: '',
});

Page<IData, IAimData>({
  data: getDefaultData(),

  onLoad() {
    this.getVersionInfo();
  },

  onShow() {
    this.getTabBar().init();
    this.init();
  },

  onPullDownRefresh() {
    this.init();
  },

  init() {
    this.fetUseriInfoHandle();
  },

  fetUseriInfoHandle() {
    fetchUserCenter().then((res: UserCenterData) => {
      const { userInfo, countsData, orderTagInfos: orderInfo, customerServiceInfo } = res;

      menuData[0].forEach((v) => {
        countsData.forEach((counts) => {
          if (counts.type === v.type) {
            v.tit = counts.num;
          }
        });
      });

      const info = orderTagInfos.map((v, index) => ({
        ...v,
        ...orderInfo[index],
      }));

      this.setData({
        userInfo,
        menuData,
        orderTagInfos: info,
        customerServiceInfo,
        currAuthStep: 2,
      });
      wx.stopPullDownRefresh();
    });
  },

  onClickCell(e: any) {
    const { type } = e.currentTarget.dataset;

    switch (type) {
      case 'address': {
        wx.navigateTo({ url: '/pages/user/address/list/index' });
        break;
      }
      case 'service': {
        this.openMakePhone();
        break;
      }
      case 'help-center': {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '你点击了帮助中心',
          icon: '',
          duration: 1000,
        });
        break;
      }
      case 'point': {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '你点击了积分菜单',
          icon: '',
          duration: 1000,
        });
        break;
      }
      case 'coupon': {
        wx.navigateTo({ url: '/pages/coupon/coupon-list/index' });
        break;
      }
      default: {
        Toast({
          context: this,
          selector: '#t-toast',
          message: '未知跳转',
          icon: '',
          duration: 1000,
        });
        break;
      }
    }
  },

  jumpNav(e: any) {
    const status = e.detail.tabType;

    if (status === 0) {
      wx.navigateTo({ url: '/pages/order/after-service-list/index' });
    } else {
      wx.navigateTo({ url: `/pages/order/order-list/index?status=${status}` });
    }
  },

  jumpAllOrder() {
    wx.navigateTo({ url: '/pages/order/order-list/index' });
  },

  openMakePhone() {
    this.setData({ showMakePhone: true });
  },

  closeMakePhone() {
    this.setData({ showMakePhone: false });
  },

  call() {
    wx.makePhoneCall({
      phoneNumber: this.data.customerServiceInfo.servicePhone || '',
    });
  },

  gotoUserEditPage() {
    const { currAuthStep } = this.data;
    if (currAuthStep === 2) {
      wx.navigateTo({ url: '/pages/user/person-info/index' });
    } else {
      this.fetUseriInfoHandle();
    }
  },

  getVersionInfo() {
    const versionInfo = wx.getAccountInfoSync();
    const version = versionInfo.miniProgram.version;
    const envVersion = (versionInfo.miniProgram as any).envVersion || 'develop';
    this.setData({
      versionNo: envVersion === 'release' ? version : envVersion,
    });
  },
});

interface IData extends IAimData {
  // 扩展
}
