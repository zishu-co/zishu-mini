import { delay } from '../_utils/delay';

const images = [
  'https://zishuco.oss-cn-shanghai.aliyuncs.com/article/image/20260329131419.jpg',
  'https://zishuco.oss-cn-shanghai.aliyuncs.com/article/image/20260329131515.jpg',
  'https://zishuco.oss-cn-shanghai.aliyuncs.com/article/image/20260329131539.jpg',
  'https://zishuco.oss-cn-shanghai.aliyuncs.com/article/image/20260329131603.jpg',
  'https://zishuco.oss-cn-shanghai.aliyuncs.com/article/image/20260329131643.jpg',
  'https://zishuco.oss-cn-shanghai.aliyuncs.com/article/image/20260329131705.jpg',
];

interface TabItem {
  text: string;
  key: number;
}

export interface InnoData {
  swiper: string[];
  tabList: TabItem[];
  activityImg: string;
}

/** 获取创新数据 */
function mockFetchInno(): Promise<InnoData> {
  return delay().then(() => {
    return {
      swiper: images,
      tabList: [
        { text: '前端', key: 0 },
        { text: '后端', key: 1 },
        { text: '文档', key: 2 },
        { text: '教程', key: 3 },
        { text: '指南', key: 4 },
        { text: '课程', key: 5 },
        { text: '文件', key: 6 },
      ],
      activityImg: '/img/activity.png',
    };
  });
}

/** 获取创新数据 */
export function fetchInno(): Promise<InnoData> {
  return mockFetchInno();
}
