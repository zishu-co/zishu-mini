interface TabItem {
  icon: string;
  text: string;
  url: string;
}

const TabMenu: TabItem[] = [
  {
    icon: 'book',
    text: '学习',
    url: 'pages/index/index',
  },
  {
    icon: 'lightbulb',
    text: '创新',
    url: 'pages/inno/index',
  },
  {
    icon: 'dart-board-filled',
    text: '目标',
    url: 'pages/aim/index',
  },
  {
    icon: 'member',
    text: '活动',
    url: 'pages/event/index',
  },
  {
    icon: 'user',
    text: '我的',
    url: 'pages/my/my',
  },
];

export default TabMenu;
