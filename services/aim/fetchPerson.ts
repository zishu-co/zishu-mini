import { delay } from '../_utils/delay';

interface Address {
  provinceName: string;
  provinceCode: string;
  cityName: string;
  cityCode: string;
}

interface PersonData {
  avatarUrl: string;
  nickName: string;
  phoneNumber: string;
  gender: number;
  address: Address;
}

/** 生成个人中心信息 */
function genPersonData(): PersonData {
  return {
    avatarUrl:
      'https://we-retail-static-1300977798.cos.ap-guangzhou.myqcloud.com/retail-ui/components-exp/avatar/avatar-1.jpg',
    nickName: 'TDesign 🌟',
    phoneNumber: '13438358888',
    gender: 2,
    address: {
      provinceName: '广东省',
      provinceCode: '440000',
      cityName: '深圳市',
      cityCode: '440300',
    },
  };
}

/** 获取个人中心信息 */
export function fetchPerson(): Promise<PersonData> {
  return delay().then(() => genPersonData());
}
