import TabMenu from './data';

Component({
  data: {
    active: 2,
    list: TabMenu,
  },

  lifetimes: {
    attached() {
      this.init();
    },
  },

  methods: {
    onChange(event: any) {
      const nextIndex = Number(event.detail.value);
      if (isNaN(nextIndex) || !this.data.list[nextIndex]) return;
      if (nextIndex === this.data.active) return;

      this.setData({ active: nextIndex });
      const rawUrl = this.data.list[nextIndex].url;
      wx.switchTab({
        url: rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`,
      });
    },

    init() {
      const pages = getCurrentPages();
      const page = pages.length ? pages[pages.length - 1] : null;
      const route = page ? page.route : '';
      if (!route) return;

      const active = this.data.list.findIndex((item: any) => {
        const itemUrl = item.url.startsWith('/') ? item.url.slice(1) : item.url;
        return itemUrl === route || itemUrl === `${route}/index`;
      });

      if (active !== -1 && active !== this.data.active) {
        this.setData({ active });
      }
    },
  },
});
