// pages/event/index.ts
import Toast from 'tdesign-miniprogram/toast/index';
import Dialog from 'tdesign-miniprogram/dialog/index';
import { fetchEventGroupData, EventResponse } from '../../services/event/event';

interface IEventData {
  eventGroupData: EventResponse['data'] | null;
}

Page<IData, IEventData>({
  data: {
    eventGroupData: null,
  },

  onShow() {
    this.getTabBar().init();
  },

  onLoad() {
    this.refreshData();
  },

  refreshData() {
    this.getEventGroupData().then((res) => {
      this.setData({ eventGroupData: res.data });
    });
  },

  getEventGroupData() {
    const { eventGroupData } = this.data;
    if (!eventGroupData) {
      return fetchEventGroupData();
    }
    return Promise.resolve({ data: eventGroupData });
  },

  onGoodsSelect(e: any) {
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

  onQuantityChange() {
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

  goGoodsDetail(e: any) {
    const { spuId, storeId } = e.detail.goods;
    wx.navigateTo({
      url: `/pages/goods/details/index?spuId=${spuId}&storeId=${storeId}`,
    });
  },

  onGoodsDelete(e: any) {
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

interface IData {
  eventGroupData: EventResponse['data'] | null;
}
