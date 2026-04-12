import { delay } from '../_utils/delay';

interface GoodsItem {
  thumb: string;
  title: string;
  price: string;
}

interface PromotionGoods {
  goodsPromotionList: GoodsItem[];
}

interface StoreGoods {
  storeId: string;
  storeName: string;
  promotionGoodsList: PromotionGoods[];
  shortageGoodsList: any[];
}

interface CartData {
  isNotEmpty: boolean;
  storeGoods: StoreGoods[];
  invalidGoodItems: any[];
}

interface CartResponse {
  data: CartData;
}

/** 生成购物车数据 */
function genCartGroupData(): CartResponse {
  return {
    data: {
      isNotEmpty: true,
      storeGoods: [
        {
          storeId: '1000',
          storeName: '云Mall深圳旗舰店',
          promotionGoodsList: [
            {
              goodsPromotionList: [
                {
                  thumb: 'https://tdesign.gtimg.com/miniprogram/template/retail/goods/dz-3a.png',
                  title: '腾讯极光盒子4智能网络电视机顶盒6K千兆网络机顶盒4K高分辨率',
                  price: '99',
                },
                {
                  thumb: 'https://tdesign.gtimg.com/miniprogram/template/retail/goods/nz-09a.png',
                  title: '白色短袖连衣裙荷叶边裙摆宽松韩版休闲纯白清爽优雅连衣裙',
                  price: '298',
                },
                {
                  thumb: 'https://tdesign.gtimg.com/miniprogram/template/retail/goods/muy-3a.png',
                  title: '带帽午休毯虎年款多功能加厚加大加绒简约多功能午休毯连帽披肩',
                  price: '299',
                },
                {
                  thumb: 'https://tdesign.gtimg.com/miniprogram/template/retail/goods/gh-2b.png',
                  title: '不锈钢刀叉勺套装家用西餐餐具ins简约耐用不锈钢金色银色可选',
                  price: '299',
                },
              ],
            },
            {
              goodsPromotionList: [
                {
                  thumb: 'https://tdesign.gtimg.com/miniprogram/template/retail/goods/nz-17a.png',
                  title: '运动连帽拉链卫衣休闲开衫长袖多色运动细绒面料运动上衣',
                  price: '259',
                },
                {
                  thumb: 'https://tdesign.gtimg.com/miniprogram/template/retail/goods/dz-2a.png',
                  title: '迷你便携高颜值蓝牙无线耳机立体声只能触控式操作简约立体声耳机',
                  price: '290',
                },
              ],
            },
          ],
          shortageGoodsList: [],
        },
      ],
      invalidGoodItems: [],
    },
  };
}

/** 获取购物车数据 */
export function fetchCartGroupData(): Promise<CartResponse> {
  return delay().then(() => genCartGroupData());
}
