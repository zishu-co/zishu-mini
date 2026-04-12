# 组件开发规范

> 规范组件的开发流程和代码标准，确保组件质量和复用性。

---

## 📦 组件分类

### 1. 全局组件 (components/)

- **位置**: 项目根目录 `components/`
- **特点**: 全项目可复用
- **使用**: 任意页面直接引用

### 2. 页面私有组件 (pages/*/components/)

- **位置**: 各页面目录下的 `components/`
- **特点**: 仅该页面使用
- **使用**: 必须在页面 JSON 中声明

---

## 🛠️ 组件开发标准

### 1. 组件文件结构

```
组件目录/
├── index.ts               # 组件逻辑
├── index.wxml             # 组件结构
├── index.wxss             # 组件样式
└── index.json             # 组件配置
```

### 2. 组件配置 (index.json)

```json
{
  "component": true,
  "usingComponents": {
    "td-button": "tdesign-miniprogram/button/index",
    "td-icon": "tdesign-miniprogram/icon/index"
  },
  "properties": {
    "title": {
      "type": String,
      "value": "默认标题"
    }
  },
  "externalClasses": [
    "custom-class"
  ]
}
```

### 3. 组件类型定义

```typescript
// ========== 组件 Props 定义 ==========
interface IProps {
  title: string;
  content?: string;
  disabled?: boolean;
}

// ========== 组件 Data 定义 ==========
interface IData {
  loading: boolean;
  localValue: string;
}

// ========== 组件 Methods 定义 ==========
interface IMethods {
  onTap(): void;
  onChange(e: WechatMiniprogram.TouchEvent): void;
}

// ========== Component 泛型定义 ==========
Component<IData, IProps, IMethods>({
  // 外部传入的属性
  properties: {
    title: {
      type: String,
      value: '默认标题'
    },
    content: {
      type: String,
      value: ''
    },
    disabled: {
      type: Boolean,
      value: false
    }
  },

  // 组件内部数据
  data: {
    loading: false,
    localValue: ''
  },

  // 组件方法
  methods: {
    onTap() {
      if (this.properties.disabled) return;
      this.triggerEvent('tap', { value: this.data.localValue });
    }
  }
});
```

---

## 📝 命名规范

| 类型 | 规范 | 示例 |
|-----|------|-----|
| 组件目录 | kebab-case | `goods-card/` |
| 组件属性 | camelCase | `goodsTitle`, `imageList` |
| 组件事件 | camelCase | `bind:tap` → 触发 `tap` |
| 样式类 | BEM 规范 | `.goods-card__title` |

---

## 📚 组件文档模板

```markdown
# {组件名称}

## 基本信息

| 属性 | 说明 | 类型 | 默认值 |
|-----|------|-----|-------|
| title | 标题 | string | - |
| image | 图片地址 | string | - |

## 事件

| 事件名 | 说明 | 参数 |
|-------|------|-----|
| tap | 点击事件 | `{ detail: { value } }` |

## 使用示例

\`\`\`html
<component-name 
  title="示例"
  bind:tap="onTap"
/>
\`\`\`

## 注意事项

- xxx
```

---

## 📋 当前组件清单

### 全局组件

| 组件名 | 路径 | 描述 | 状态 |
|-------|------|-----|-----|
| goods-card | `components/goods-card/` | 商品卡片展示 | ✅ |
| goods-list | `components/goods-list/` | 商品列表容器 | ✅ |
| load-more | `components/load-more/` | 加载更多组件 | ✅ |
| price | `components/price/` | 价格展示组件 | ✅ |
| swipeout | `components/swipeout/` | 滑动操作组件 | ✅ |
| webp-image | `components/webp-image/` | WebP 图片支持 | ✅ |

### 页面私有组件

| 组件名 | 所属页面 | 描述 |
|-------|---------|------|
| order-group | aim/my | 订单分组展示 |
| ui-select-picker | aim | 选择器组件 |
| user-center-card | aim/my | 用户中心卡片 |
| cart-group | event | 购物车分组 |
| specs-popup | event | 规格弹窗 |

---

## ✅ 组件验收标准

1. **功能完整性** - 所有属性和事件正常工作
2. **类型安全** - 所有属性有明确的类型定义
3. **样式隔离** - 组件样式不影响外部
4. **文档完整** - 有使用示例和注意事项
5. **性能良好** - 无不必要的重渲染
