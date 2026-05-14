// @ts-nocheck
import base from '../../services/base'
const { get } = base

Page({
  data: {
    members: [] as any[],
    loading: true,
  },

  onLoad() {
    this.fetchMembers()
  },

  fetchMembers() {
    this.setData({ loading: true })
    get('/api/users/fetch_all_users')
      .then((res: any) => {
        const members = Array.isArray(res) ? res : []
        this.setData({
          members,
          loading: false,
        })
      })
      .catch((e) => {
        this.setData({ members: [], loading: false })
      })
  },

  get totalCount(): number {
    return this.data.members.length
  },
  get activeCount(): number {
    return this.data.members.filter((u: any) => u.shuzhi >= 10).length
  },
  get inactiveCount(): number {
    return this.data.members.filter((u: any) => u.shuzhi < 10).length
  },
})