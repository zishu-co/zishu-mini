# 组件库清单

> 记录项目中所有可复用组件的清单。

---

## 📦 全局组件

| 组件 | 路径 | 用途 | 依赖 |
|-----|------|-----|-----|
| goods-card | `components/goods-card/` | 商品卡片展示 | TDesign |
| goods-list | `components/goods-list/` | 商品列表容器 | - |
| load-more | `components/load-more/` | 加载更多 | TDesign |
| price | `components/price/` | 价格展示 | - |
| swipeout | `components/swipeout/` | 滑动操作 | - |
| webp-image | `components/webp-image/` | WebP 图片 | - |

---

## 📦 页面私有组件

### aim 页面

| 组件 | 路径 | 用途 |
|-----|------|-----|
| order-group | `pages/aim/components/order-group/` | 订单分组 |
| ui-select-picker | `pages/aim/components/ui-select-picker/` | 选择器 |
| user-center-card | `pages/aim/components/user-center-card/` | 用户卡片 |

### event 页面

| 组件 | 路径 | 用途 |
|-----|------|-----|
| event-group | `pages/event/components/event-group/` | 活动分组 |
| goods-card | `pages/event/components/goods-card/` | 活动商品卡片 |
| specs-popup | `pages/event/components/specs-popup/` | 规格选择弹窗 |

### my 页面

| 组件 | 路径 | 用途 |
|-----|------|-----|
| order-group | `pages/my/components/order-group/` | 订单分组 |
| user-center-card | `pages/my/components/user-center-card/` | 用户卡片 |

---

## 🔧 组件使用方式

### 全局组件

```json
// app.json 或页面的 index.json
{
  "usingComponents": {
    "goods-card": "/components/goods-card/index",
    "load-more": "/components/load-more/index"
  }
}
```

```html
<!-- wxml -->
<goods-card goods="{{item}}" bind:tap="onCardTap" />
<load-more status="{{loadingStatus}}" />
```

### 页面私有组件

```json
// 页面的 index.json
{
  "usingComponents": {
    "order-group": "./components/order-group/index"
  }
}
```

---

## 📝 组件登记规则

新增组件时必须：

1. 创建组件文件并编写完整代码
2. 在本文档登记组件信息
3. 编写组件使用文档
4. 如可全局复用，移动到 `components/` 目录
