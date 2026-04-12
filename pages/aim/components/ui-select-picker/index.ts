Component({
  data: {
    show: false,
    pickerValue: [0],
    pickerOptions: [] as Array<{ code: string; name: string }>,
  },

  properties: {
    headerVisible: {
      type: Boolean,
      value: false,
    },
    title: {
      type: String,
      value: '',
    },
    options: {
      type: Array,
      value: [],
    },
    value: {
      type: Array,
      value: [],
    },
  },

  observers: {
    'options, value': function (options: any[], value: number[]) {
      if (options.length > 0 && value.length > 0) {
        this.setData({
          pickerOptions: options,
          pickerValue: value,
        });
      }
    },
  },

  methods: {
    onChange(e: any) {
      const value = e.detail.value;
      this.setData({ pickerValue: value });
    },

    onConfirm() {
      const value = this.data.pickerValue;
      this.triggerEvent('onConfirm', { value });
      this.setData({ show: false });
    },

    onClose() {
      this.setData({ show: false });
      this.triggerEvent('onClose');
    },

    open() {
      this.setData({ show: true });
    },
  },
});
