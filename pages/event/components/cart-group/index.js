Component({
  properties: {
    storeGoods: {
      type: Array,
      observer(storeGoods) {
        for (const store of storeGoods) {
          for (const activity of store.promotionGoodsList) {
            for (const goods of activity.goodsPromotionList) {
              goods.price = formatPrice(goods.price);
            }
          }
          for (const goods of store.shortageGoodsList) {
            goods.price = formatPrice(goods.price);
          }
        }
        this.setData({ _storeGoods: storeGoods });
      },
    },
    invalidGoodItems: {
      type: Array,
      observer(invalidGoodItems) {
        this.setData({ _invalidGoodItems: invalidGoodItems });
      },
    },
  },

  data: {
    _storeGoods: [],
    _invalidGoodItems: [],
  },

  methods: {
    deleteGoods(e) {
      const { goods } = e.currentTarget.dataset;
      this.triggerEvent('delete', { goods });
    },
  },
});

// 格式化价格（分转元）
function formatPrice(price) {
  if (!price) return '0.00';
  const num = parseFloat(price);
  return (num / 100).toFixed(2);
}
