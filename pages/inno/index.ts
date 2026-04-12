// pages/inno/index.ts
import { fetchHome, HomeData } from '../../services/home/home';
import { fetchGoodsList, Goods } from '../../services/good/fetchGoods';

// Toast 使用 require 方式导入
const Toast = require('tdesign-miniprogram/toast/index').default;

type IData = {
  imgSrcs: string[];
  tabList: { text: string; key: number }[];
  goodsList: Goods[];
  goodsListLoadStatus: number;
  pageLoading: boolean;
  current: number;
  autoplay: boolean;
  duration: string;
  interval: number;
  navigation: { type: string };
  swiperImageProps: { mode: string };
};

Page<IData, IData>({
  data: {
    imgSrcs: [],
    tabList: [],
    goodsList: [],
    goodsListLoadStatus: 0,
    pageLoading: false,
    current: 1,
    autoplay: true,
    duration: '500',
    interval: 5000,
    navigation: { type: 'dots' },
    swiperImageProps: { mode: 'scaleToFill' },
  },

  goodListPagination: {
    index: 0,
    num: 20,
  },

  privateData: {
    tabIndex: 0,
  },

  onShow() {
    this.getTabBar().init();
  },

  onLoad() {
    this.init();
  },

  onPullDownRefresh() {
    this.init();
  },

  init() {
    console.log('初始化页面')
    this.loadHomePage();
  },

  loadHomePage() {
    wx.stopPullDownRefresh();

    this.setData({
      pageLoading: true,
    });

    fetchHome().then((res: HomeData) => {
      this.setData({
        tabList: res.tabList,
        imgSrcs: res.swiper,
        pageLoading: false,
      });
      this.loadGoodsList(true);
    });
  },

  tabChangeHandle(e: any) {
    this.privateData.tabIndex = e.detail;
    this.loadGoodsList(true);
  },

  onReTry() {
    this.loadGoodsList();
  },

  async loadGoodsList(fresh = false) {
    if (fresh) {
      wx.pageScrollTo({
        scrollTop: 0,
      });
    }

    this.setData({ goodsListLoadStatus: 1 });

    const pageSize = this.goodListPagination.num;
    let pageIndex = this.privateData.tabIndex * pageSize + this.goodListPagination.index + 1;
    if (fresh) {
      pageIndex = 0;
    }

    try {
      const nextList = await fetchGoodsList(pageIndex, pageSize);
      this.setData({
        goodsList: fresh ? nextList : this.data.goodsList.concat(nextList),
        goodsListLoadStatus: 0,
      });

      this.goodListPagination.index = pageIndex;
      this.goodListPagination.num = pageSize;
      console.log(this.data.goodsList.length)
    } catch (err) {
      console.log('获取失败')
      this.setData({ goodsListLoadStatus: 3 });
    }
  },

  goodListClickHandle(e: any) {
    const { index } = e.detail;
    const { spuId } = this.data.goodsList[index];
    wx.navigateTo({
      url: `/pages/goods/details/index?spuId=${spuId}`,
    });
  },

  goodListAddCartHandle() {
    Toast({
      context: this,
      selector: '#t-toast',
      message: '点击加入购物车',
    });
  },

  navToSearchPage() {
    // 待实现
  },

  navToActivityDetail(detail: any) {
    const { index: promotionID = 0 } = detail || {};
    wx.navigateTo({
      url: `/pages/promotion/promotion-detail/index?promotion_id=${promotionID}`,
    });
  },
});
