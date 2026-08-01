// @ts-nocheck
import base from '../../services/base'
const { get } = base

Page({
  data: {
    listData: [] as any[],
    loading: true,
  },

  onLoad() {
    this.fetchData()
  },

  fetchData() {
    this.setData({ loading: true })
    get('/api/course/list_all_mentors')
      .then((res: any) => {
        const listData = Array.isArray(res) ? res : []
        this.setData({ listData, loading: false })
      })
      .catch((e) => {
        this.setData({ listData: [], loading: false })
      })
  },

  get shushiCount(): number {
    const ids = new Set<number>()
    this.data.listData.forEach((item: any) => { if (item.shushi_id) ids.add(item.shushi_id) })
    return ids.size
  },

  get shushengCount(): number {
    const ids = new Set<number>()
    this.data.listData.forEach((item: any) => { if (item.shusheng_id) ids.add(item.shusheng_id) })
    return ids.size
  },

  onShareAppMessage() {
    return { title: '自塾·师生关系', path: '/pages/mentors/index' };
  },

  onShareTimeline() {
    return { title: '自塾·师生关系' };
  },
})