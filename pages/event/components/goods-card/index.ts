Component({
  options: {
    addGlobalClass: true,
  },

  properties: {
    goods: {
      type: Object,
      value: {},
    },
    id: {
      type: String,
      value: '',
    },
    layout: {
      type: String,
      value: 'vertical',
    },
    centered: {
      type: Boolean,
      value: false,
    },
    thumbMode: {
      type: String,
      value: 'aspectFill',
    },
    lazyLoad: {
      type: Boolean,
      value: true,
    },
    pricePrefix: {
      type: String,
      value: '',
    },
    currency: {
      type: String,
      value: '¥',
    },
    priceFill: {
      type: Boolean,
      value: true,
    },
    isValidityLinePrice: {
      type: Boolean,
      value: true,
    },
    hiddenInData: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    independentID: '',
  },

  lifetimes: {
    attached() {
      this.setData({
        independentID: `goods-card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      });
    },
  },

  methods: {
    clickHandle(e: any) {
      this.triggerEvent('click', e.currentTarget.dataset.goods);
    },

    clickThumbHandle(e: any) {
      this.triggerEvent('thumb', e.currentTarget.dataset.goods);
    },

    clickSpecsHandle() {
      this.triggerEvent('specs');
    },
  },
});
