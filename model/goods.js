
const mockGoods = [
  {
    spuId: '1001',
    thumb: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    title: '无线蓝牙耳机 降噪音乐耳机',
    tags: ['新品', '热卖'],
    price: '299.00',
    originPrice: '399.00',
  },
  {
    spuId: '1002',
    thumb: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    title: '智能手表 运动版',
    tags: ['爆款'],
    price: '899.00',
    originPrice: '1299.00',
  },
  {
    spuId: '1003',
    thumb: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop',
    title: '智能手环 运动健康监测',
    tags: ['限时特惠'],
    price: '199.00',
    originPrice: '',
  },
  {
    spuId: '1004',
    thumb: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=400&fit=crop',
    title: '便携式蓝牙音箱 防水音响',
    tags: ['新品'],
    price: '159.00',
    originPrice: '259.00',
  },
  {
    spuId: '1005',
    thumb: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop',
    title: '复古太阳镜 时尚墨镜',
    tags: ['热卖'],
    price: '89.00',
    originPrice: '129.00',
  },
  {
    spuId: '1006',
    thumb: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    title: '双肩背包 商务休闲两用',
    tags: ['新品', '推荐'],
    price: '259.00',
    originPrice: '359.00',
  },
];

export function getGoodsList(baseID = 0, length = 10) {
  return mockGoods;
}

export const goodsList = mockGoods;