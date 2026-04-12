let ARRAY: any[] = [];

Component({
  externalClasses: ['wr-class'],

  options: {
    multipleSlots: true,
  },
  properties: {
    disabled: Boolean,
    leftWidth: {
      type: Number,
      value: 0,
    },
    rightWidth: {
      type: Number,
      value: 0,
    },
    asyncClose: Boolean,
  },
  attached() {
    ARRAY.push(this);
  },

  detached() {
    ARRAY = ARRAY.filter((item) => item !== this);
  },

  data: {
    wrapperStyle: '',
    asyncClose: false,
    closed: true,
  },

  methods: {
    open(position: string) {
      this.setData({ closed: false });
      this.triggerEvent('close', {
        position,
        instance: this,
      });
    },

    close() {
      this.setData({ closed: true });
    },

    closeOther() {
      ARRAY.filter((item) => item !== this).forEach((item) => item.close());
    },

    noop() {
      return;
    },

    onClick(event: any) {
      const { key: position = 'outside' } = event.currentTarget.dataset;
      this.triggerEvent('click', position);

      if (this.data.closed) {
        return;
      }

      if (this.data.asyncClose) {
        this.triggerEvent('close', {
          position,
          instance: this,
        });
      } else {
        this.close();
      }
    },
  },
});
