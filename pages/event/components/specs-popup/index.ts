Component({
  data: {
    show: false,
    goods: null as any,
  },

  properties: {
    visible: {
      type: Boolean,
      value: false,
      observer(val: boolean) {
        this.setData({ show: val });
      },
    },
  },

  methods: {
    close() {
      this.setData({ show: false });
      this.triggerEvent('close');
    },

    confirm() {
      this.triggerEvent('confirm', this.data.goods);
      this.close();
    },
  },
});
