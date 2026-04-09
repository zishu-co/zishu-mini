import Toast from 'tdesign-miniprogram/toast/index';
import Dialog from 'tdesign-miniprogram/dialog/index';
import { fetchCartGroupData } from '../../services/cart/cart';

Page({
  data: {
    cartGroupData: null,
  },

  onShow() {
    this.getTabBar().init();
  },

  onLoad() {
    this.refreshData();
  },

  refreshData() {
    this.getCartGroupData().then((res) => {
      this.setData({ cartGroupData: res.data });
    });
  },

  getCartGroupData() {
    const { cartGroupData } = this.data;
    if (!cartGroupData) {
      return fetchCartGroupData();
    }
    return Promise.resolve({ data: cartGroupData });
  },

  onGoodsSelect(e) {
    const { title } = e.detail.goods;
    Toast({
      context: this,
      selector: '#t-toast',
      message: `选择了"${title.length > 5 ? title.slice(0, 5) + '...' : title}"`,
      icon: '',
    });
    this.refreshData();
  },

  onStoreSelect() {
    this.refreshData();
  },

  onQuantityChange(e) {
    Toast({
      context: this,
      selector: '#t-toast',
      message: '数量已变更',
    });
    this.refreshData();
  },

  goCollect() {
    wx.navigateTo({
      url: '/pages/promotion/promotion-detail/index?promotion_id=123',
    });
  },

  goGoodsDetail(e) {
    const { spuId, storeId } = e.detail.goods;
    wx.navigateTo({
      url: `/pages/goods/details/index?spuId=${spuId}&storeId=${storeId}`,
    });
  },

  onGoodsDelete(e) {
    const { title } = e.detail.goods;
    Dialog.confirm({
      content: `确认删除"${title}"吗?`,
      confirmBtn: '确定',
      cancelBtn: '取消',
    }).then(() => {
      Toast({ context: this, selector: '#t-toast', message: '商品删除成功' });
      this.refreshData();
    });
  },
});
