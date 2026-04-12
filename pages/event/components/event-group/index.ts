Component({
  data: {
    _storeGoods: [] as any[],
  },

  properties: {
    storeGoods: {
      type: Array,
      value: [],
    },
  },

  observers: {
    storeGoods(val: any[]) {
      this.setData({ _storeGoods: val });
    },
  },

  methods: {
    deleteGoods(e: any) {
      const goods = e.currentTarget.dataset.goods;
      this.triggerEvent('delete', { goods });
    },
  },
});
