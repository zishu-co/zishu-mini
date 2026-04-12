Component({
  externalClasses: ['wr-class', 'symbol-class', 'decimal-class'],
  useStore: [] as any,
  properties: {
    priceUnit: {
      type: String,
      value: 'fen',
    },
    price: {
      type: null,
      value: '',
      observer(price: any) {
        this.format(price);
      },
    },
    type: {
      type: String,
      value: '',
    },
    symbol: {
      type: String,
      value: '¥',
    },
    fill: Boolean,
    decimalSmaller: Boolean,
    lineThroughWidth: {
      type: null,
      value: '0.12em',
    },
  },

  data: {
    pArr: [] as string[],
  },

  methods: {
    format(price: any) {
      price = parseFloat(`${price}`);
      const pArr: string[] = [];
      if (!isNaN(price)) {
        const isMinus = price < 0;
        if (isMinus) {
          price = -price;
        }
        if (this.properties.priceUnit === 'yuan') {
          const priceSplit = price.toString().split('.');
          pArr[0] = priceSplit[0];
          pArr[1] = !priceSplit[1]
            ? '00'
            : priceSplit[1].length === 1
            ? `${priceSplit[1]}0`
            : priceSplit[1];
        } else {
          price = Math.round(price * 10 ** 8) / 10 ** 8;
          price = Math.ceil(price);
          pArr[0] = price >= 100 ? `${price}`.slice(0, -2) : '0';
          pArr[1] = `${price + 100}`.slice(-2);
        }
        if (!(this.properties as any).fill) {
          if (pArr[1] === '00') pArr[1] = '';
          else if ((pArr[1] as any)[1] === '0') pArr[1] = (pArr[1] as any)[0];
        }
        if (isMinus) {
          pArr[0] = `-${pArr[0]}`;
        }
      }
      this.setData({ pArr });
    },
  },
});
