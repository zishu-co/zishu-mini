import { delay } from '../_utils/delay';

/** 生成个人中心信息 */
function genPersonData() {
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
export function fetchPerson() {
  return delay().then(() => genPersonData());
}
