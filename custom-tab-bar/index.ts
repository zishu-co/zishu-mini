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
      // 默认显示"目标"模块（索引2）
      const defaultActive = 2;

      const page = getCurrentPages().pop();
      const route = page ? page.route.split('?')[0] : '';
      const active = this.data.list.findIndex(
        (item: any) =>
          (item.url.startsWith('/') ? item.url.substr(1) : item.url) ===
          `${route}`,
      );
      // 只有当页面匹配到 tabBar 中的项目时才切换，否则默认显示"目标"
      this.setData({ active: active !== -1 ? active : defaultActive });
    },
  },
});
