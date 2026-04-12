Component({
  data: {
    classPrefix: 'order',
  },

  properties: {
    title: {
      type: String,
      value: '我的订单',
    },
    desc: {
      type: String,
      value: '全部订单',
    },
    isTop: {
      type: Boolean,
      value: true,
    },
    orderTagInfos: {
      type: Array,
      value: [],
    },
  },

  methods: {
    onClickTop() {
      this.triggerEvent('onClickTop');
    },

    onClickItem(e: any) {
      const item = e.currentTarget.dataset.item;
      this.triggerEvent('onClickItem', { item });
    },
  },
});
