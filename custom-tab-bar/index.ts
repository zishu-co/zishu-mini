import TabMenu from './data';

Component({
  data: {
    active: 2,
    list: TabMenu,
  },

  methods: {
    onChange(event: any) {
      this.setData({ active: event.detail.value });
      wx.switchTab({
        url: this.data.list[event.detail.value].url.startsWith('/')
          ? this.data.list[event.detail.value].url
          : `/${this.data.list[event.detail.value].url}`,
      });
    },

    init() {
      const page = getCurrentPages().pop();
      const route = page ? page.route : '';
      
      // 在 tabBar 列表中查找当前页面
      const active = this.data.list.findIndex(
        (item: any) => {
          const itemUrl = item.url.startsWith('/') ? item.url.substr(1) : item.url;
          return itemUrl === route || itemUrl === `${route}/index`;
        }
      );
      
      // 如果找到匹配项则设置，否则保持当前状态
      if (active !== -1) {
        this.setData({ active });
      }
    },
  },
});
