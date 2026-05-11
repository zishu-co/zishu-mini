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

interface EventData {
  isNotEmpty: boolean;
  storeGoods: StoreGoods[];
  invalidGoodItems: any[];
}

interface EventResponse {
  data: EventData;
}

/** 生成活动数据 - 使用 16:9 比例的商品图片 */
function genEventGroupData(): EventResponse {
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
                  thumb: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400&h=225&fit=crop',
                  title: '腾讯极光盒子4智能网络电视机顶盒6K千兆网络机顶盒4K高分辨率',
                  price: '99',
                },
                {
                  thumb: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=225&fit=crop',
                  title: '白色短袖连衣裙荷叶边裙摆宽松韩版休闲纯白清爽优雅连衣裙',
                  price: '298',
                },
                {
                  thumb: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=225&fit=crop',
                  title: '带帽午休毯虎年款多功能加厚加大加绒简约多功能午休毯连帽披肩',
                  price: '299',
                },
                {
                  thumb: 'https://images.unsplash.com/photo-1512631118612-7bf025940184?w=400&h=225&fit=crop',
                  title: '不锈钢刀叉勺套装家用西餐餐具ins简约耐用不锈钢金色银色可选',
                  price: '299',
                },
              ],
            },
            {
              goodsPromotionList: [
                {
                  thumb: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&h=225&fit=crop',
                  title: '运动连帽拉链卫衣休闲开衫长袖多色运动细绒面料运动上衣',
                  price: '259',
                },
                {
                  thumb: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=225&fit=crop',
                  title: '迷你便携高颜值蓝牙无线耳机立体声只能触控式操作简约立体声耳机',
                  price: '290',
                },
              ],
            },
          ],
          shortageGoodsList: [
            {
              thumb: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=225&fit=crop',
              title: '红色运动跑鞋专业减震透气轻便跑步鞋（已售罄）',
              price: '399',
            },
          ],
        },
      ],
      invalidGoodItems: [],
    },
  };
}

/** 获取活动数据 */
export function fetchEventGroupData(): Promise<EventResponse> {
  return delay().then(() => genEventGroupData());
}
