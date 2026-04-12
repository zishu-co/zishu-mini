const systemInfo = wx.getSystemInfoSync();

Component({
  externalClasses: ['t-class', 't-class-load'],
  properties: {
    loadFailed: {
      type: String,
      value: 'default',
    },
    loading: {
      type: String,
      value: 'default',
    },
    src: {
      type: String,
      value: '',
    },
    mode: {
      type: String,
      value: 'aspectFill',
    },
    webp: {
      type: Boolean,
      value: true,
    },
    lazyLoad: {
      type: Boolean,
      value: false,
    },
    showMenuByLongpress: {
      type: Boolean,
      value: false,
    },
  },
  data: {
    thumbHeight: 375,
    thumbWidth: 375,
    systemInfo,
  },
  lifetimes: {
    ready() {
      const { mode } = this.properties;
      this.getRect('.J-image').then((res: any) => {
        if (res) {
          const { width, height } = res;
          this.setData(
            mode === 'heightFix'
              ? {
                  thumbHeight: this.px2rpx(height) || 375,
                }
              : {
                  thumbWidth: this.px2rpx(width) || 375,
                },
          );
        }
      });
    },
  },
  methods: {
    px2rpx(px: number) {
      return (750 / (systemInfo.screenWidth || 375)) * px;
    },
    getRect(selector: string) {
      return new Promise((resolve) => {
        if (!this.selectorQuery) {
          this.selectorQuery = this.createSelectorQuery();
        }
        (this.selectorQuery as any).select(selector).boundingClientRect(resolve).exec();
      });
    },
    onLoad(e: any) {
      this.triggerEvent('load', e.detail);
    },
    onError(e: any) {
      this.triggerEvent('error', e.detail);
    },
    selectorQuery: null as any,
  },
});
