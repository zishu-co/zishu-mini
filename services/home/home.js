import { config, cdnBase } from '../../config/index';

/** 获取创新数据 */
function mockFetchHome() {
  const { delay } = require('../_utils/delay');
  const { genSwiperImageList } = require('../../model/swiper');
  return delay().then(() => {
    return {
      swiper: genSwiperImageList(),
      tabList: [
        {
          text: '前端',
          key: 0,
        },
        {
          text: '后端',
          key: 1,
        },
        {
          text: '文档',
          key: 2,
        },
        {
          text: '教程',
          key: 3,
        },
        {
          text: '指南',
          key: 4,
        },
        {
          text: '课程',
          key: 5,
        },
        {
          text: '文件',
          key: 6,
        },
      ],
      activityImg: `${cdnBase}/activity/banner.png`,
    };
  });
}

/** 获取首页数据 */
export function fetchHome() {
  if (config.useMock) {
    return mockFetchHome();
  }
  return new Promise((resolve) => {
    resolve('real api');
  });
}
