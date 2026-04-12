Component({
  data: {
    defaultAvatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
  },

  properties: {
    userInfo: {
      type: Object,
      value: {},
    },
    currAuthStep: {
      type: Number,
      value: 1,
    },
    isNeedGetUserInfo: {
      type: Boolean,
      value: false,
    },
    AuthStepType: {
      type: Object,
      value: {
        ONE: 1,
        TWO: 2,
        THREE: 3,
      },
    },
  },

  methods: {
    gotoUserEditPage() {
      this.triggerEvent('gotoUserEditPage');
    },
  },
});
