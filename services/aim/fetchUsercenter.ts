import { delay } from '../_utils/delay';

interface UserInfo {
  avatarUrl: string;
  nickName: string;
  phoneNumber: string;
  gender: number;
}

interface CountItem {
  num: number;
  name: string;
  type: string;
}

interface OrderTag {
  orderNum: number;
  tabType: number;
}

interface CustomerService {
  servicePhone: string;
  serviceTimeDuration: string;
}

export interface UserCenterData {
  userInfo: UserInfo;
  countsData: CountItem[];
  orderTagInfos: OrderTag[];
  customerServiceInfo: CustomerService;
}

/** 生成个人中心数据 */
function genUsercenterData(): UserCenterData {
  const userInfo: UserInfo = {
    avatarUrl:
      'https://we-retail-static-1300977798.cos.ap-guangzhou.myqcloud.com/retail-ui/components-exp/avatar/avatar-1.jpg',
    nickName: 'TDesign 🌟',
    phoneNumber: '13438358888',
    gender: 2,
  };

  const countsData: CountItem[] = [
    { num: 2, name: '积分', type: 'point' },
    { num: 10, name: '优惠券', type: 'coupon' },
  ];

  const orderTagInfos: OrderTag[] = [
    { orderNum: 1, tabType: 5 },
    { orderNum: 1, tabType: 10 },
    { orderNum: 1, tabType: 40 },
    { orderNum: 0, tabType: 0 },
  ];

  const customerServiceInfo: CustomerService = {
    servicePhone: '4006336868',
    serviceTimeDuration: '每周三至周五 9:00-12:00  13:00-15:00',
  };

  return {
    userInfo,
    countsData,
    orderTagInfos,
    customerServiceInfo,
  };
}

/** 获取个人中心信息 */
export function fetchUserCenter(): Promise<UserCenterData> {
  return delay(200).then(() => genUsercenterData());
}
