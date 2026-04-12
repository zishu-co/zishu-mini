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

  pageLifetimes: {
    show() {
      this.init();
    },
  },

  methods: {
    onChange(event: any) {
      // 先设置 active 以提供即时视觉反馈
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

      // 获取当前页面栈
      const pages = getCurrentPages();
      if (!pages || pages.length === 0) {
        console.log('No pages in stack, using default active:', defaultActive);
        this.setData({ active: defaultActive });
        return;
      }

      const page = pages[pages.length - 1];
      const route = page ? page.route.split('?')[0] : '';
      console.log('Custom tab bar init, current route:', route, 'full page:', page);
      
      // 尝试匹配路由 - 处理多种可能的格式
      let active = -1;
      for (let i = 0; i < this.data.list.length; i++) {
        const item = this.data.list[i];
        
        // 处理 tabBar URL 格式
        let itemUrl = item.url;
        if (itemUrl.startsWith('/')) {
          itemUrl = itemUrl.substr(1);
        }
        
        // 处理页面路由格式 - 可能没有 /index 后缀
        let normalizedRoute = route;
        
        // 尝试多种匹配方式
        if (itemUrl === normalizedRoute) {
          // 精确匹配
          active = i;
          break;
        }
        
        // 如果 itemUrl 以 /index 结尾，但 route 没有
        if (itemUrl.endsWith('/index') && itemUrl.replace(/\/index$/, '') === normalizedRoute) {
          active = i;
          break;
        }
        
        // 如果 route 以 /index 结尾，但 itemUrl 没有
        if (normalizedRoute.endsWith('/index') && normalizedRoute.replace(/\/index$/, '') === itemUrl) {
          active = i;
          break;
        }
        
        // 尝试匹配基础路径
        const baseRoute = normalizedRoute.replace(/\/index$/, '');
        const baseItemUrl = itemUrl.replace(/\/index$/, '');
        if (baseItemUrl && baseRoute && baseItemUrl === baseRoute) {
          active = i;
          break;
        }
        
        // 特殊处理：aim 页面可能有不同的路由格式
        if (item.text === '目标') {
          // 如果路由包含 'aim'，就认为是目标页面
          if (normalizedRoute.includes('aim') || baseRoute.includes('aim')) {
            active = i;
            break;
          }
        }
      }
      
      console.log('Found active index:', active, 'for route:', route);
      
      // 如果找到了匹配项，使用它；否则使用默认值
      const newActive = active !== -1 ? active : defaultActive;
      console.log('Setting active to:', newActive);
      
      // 立即更新 active 值，不检查是否不同（确保状态正确）
      this.setData({ active: newActive });
    },
  },
});
