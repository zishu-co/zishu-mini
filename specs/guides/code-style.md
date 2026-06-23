# 代码风格指南

> 统一代码风格，确保团队协作效率和代码可维护性。

---

## 📐 目录结构规范

```
miniprogram-2/
├── pages/                    # 页面目录（按Tab分组）
│   ├── index/                # 学习（首页Tab）
│   ├── inno/                 # 创新Tab
│   ├── aim/                  # 目标Tab
│   ├── event/                # 活动Tab
│   ├── my/                   # 我的Tab
│   ├── login/                # 登录页
│   ├── logs/                 # 日志页
│   └── test/                 # 测试页
│
├── components/               # 通用组件（全局可复用）
│   ├── goods-card/
│   ├── goods-list/
│   ├── load-more/
│   ├── price/
│   ├── swipeout/
│   └── webp-image/
│
├── services/                 # 服务层（API调用）
│   ├── _utils/               # 工具函数
│   ├── base.ts               # 基础配置
│   ├── aim/                  # 目标模块服务
│   ├── cart/                 # 购物车模块服务
│   ├── good/                 # 商品模块服务
│   └── home/                 # 首页模块服务
│
├── custom-tab-bar/           # 自定义TabBar
├── img/                      # 静态图片资源
├── utils/                    # 工具函数
├── config/                   # 配置文件
└── docs/                     # 规范文档
```

---

## 📝 命名规范

### 1. 文件命名

| 类型 | 规范 | 示例 |
|-----|------|-----|
| 页面目录 | kebab-case | `goods-detail/` |
| 组件目录 | kebab-case | `goods-card/` |
| 页面文件 | index | `index.ts/wxml/wxss/json` |
| 组件文件 | index | `index.ts/wxml/wxss/json` |
| 工具文件 | kebab-case | `format-date.ts` |
| 服务文件 | kebab-case | `fetch-goods.ts` |

### 2. 变量命名

| 类型 | 规范 | 示例 |
|-----|------|-----|
| 普通变量 | camelCase | `userInfo`, `isLoading` |
| 常量 | UPPER_SNAKE_CASE | `MAX_COUNT`, `API_BASE_URL` |
| 布尔变量 | is/has/can 前缀 | `isLogin`, `hasPermission` |
| 数组变量 | 复数名词或 list 后缀 | `items`, `goodsList` |
| 函数 | verb + noun | `getUserInfo`, `fetchData` |

### 3. TypeScript 类型命名

| 类型 | 规范 | 示例 |
|-----|------|-----|
| 接口 | I前缀 + PascalCase | `IUserData`, `IGoodsItem` |
| 类型别名 | PascalCase | `OrderStatus`, `Gender` |
| Page泛型参数 | `IData`, `IMethods` | `Page<IData, IMethods>` |

---

## 🎨 WXML 模板规范

### 1. 缩进与换行

- 使用 **2空格** 缩进
- 属性过多时，每个属性占一行
- 组件开始标签和结束标签对齐

### 2. 指令规范

```html
<!-- ✅ 推荐 -->
<view 
  class="container"
  wx:if="{{show}}"
  bindtap="onTap"
>
  <text>{{title}}</text>
</view>

<!-- ❌ 避免 -->
<view class="container" wx:if="{{show}}" bindtap="onTap"><text>{{title}}</text></view>
```

### 3. 条件渲染

```html
<!-- ✅ 推荐：使用 wx:elif -->
<view wx:if="{{type === 'A'}}">A</view>
<view wx:elif="{{type === 'B'}}">B</view>
<view wx:else>C</view>

<!-- ❌ 避免：多层嵌套 wx:if -->
```

### 4. 列表渲染

```html
<!-- ✅ 推荐：指定 key -->
<view 
  wx:for="{{list}}" 
  wx:for-item="item"
  wx:for-index="index"
  wx:key="id"
>
  {{item.name}}
</view>
```

---

## 📦 TypeScript 规范

### 1. 类型定义

```typescript
// ✅ 推荐：显式定义接口
interface IUserInfo {
  id: string;
  name: string;
  avatar: string;
}

// ✅ 推荐：使用泛型
interface IResponse<T> {
  code: number;
  data: T;
  message: string;
}

// ✅ 推荐：Page 泛型定义
type IPageData = {
  userInfo: IUserInfo | null;
  loading: boolean;
};

type IPageMethods = {
  onLoad(): void;
  onPullDownRefresh(): void;
};

Page<IPageData, IPageMethods>({
  data: {} as IPageData,
  // ...
});
```

### 2. 禁止使用 any

```typescript
// ❌ 禁止
function handleData(data: any) {
  return data.id;
}

// ✅ 推荐：使用 unknown 或具体类型
function handleData(data: unknown) {
  if (isUserInfo(data)) {
    return data.id;
  }
}
```

### 3. API 请求封装

```typescript
// services/_utils/base.ts
const BASE_URL = 'https://api.example.com';

interface IRequestOptions {
  url: string;
  method?: 'GET' | 'POST';
  data?: any;
}

// ✅ 推荐：统一封装请求方法
export function request<T>(options: IRequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data as T);
        } else {
          reject(new Error(res.errMsg));
        }
      },
      fail: reject
    });
  });
}
```

---

## 🎯 CSS 规范

### 1. 类名命名

| 类型 | 规范 | 示例 |
|-----|------|-----|
| 页面样式 | `page-{页面名}` | `.page-goods-detail` |
| 组件样式 | `{组件名}-{用途}` | `.goods-card__title` |
| 通用样式 | `{类型}-{用途}` | `.btn-primary` |

### 2. BEM 命名（组件内）

```css
/* ✅ 推荐：BEM 规范 */
.goods-card {}
.goods-card__image {}
.goods-card__title {}
.goods-card--disabled {}

/* ✅ 推荐：状态变体 */
.goods-card__price--original {}
.goods-card__price--discounted {}
```

### 3. 单位使用

```css
/* ✅ 推荐：统一使用 rpx */
.container {
  padding: 24rpx;
  margin: 16rpx 32rpx;
}

/* ✅ 推荐：字号使用 rpx */
.title {
  font-size: 32rpx;
}
```

---

## 📚 注释规范

### 1. 文件头注释

```typescript
/**
 * @file 页面名称
 * @description 页面功能描述
 * @author 作者名
 * @date 2024-01-01
 */
```

### 2. 方法注释

```typescript
/**
 * 获取用户信息
 * @description 从本地存储获取用户信息，如不存在则返回null
 * @returns {IUserInfo | null} 用户信息对象
 */
function getUserInfo(): IUserInfo | null {
  // ...
}
```

### 3. 代码块注释

```typescript
// ========== 页面状态初始化 ==========
const app = getApp();

// ========== API 请求 ==========
wx.request({
  // ...
});
```

---

## 🚫 禁止事项

1. **禁止使用 `var`** - 必须使用 `const` 或 `let`
2. **禁止隐式 any** - 所有变量必须有类型
3. **禁止 `console.log` 在生产环境** - 使用条件编译或移除
4. **禁止硬编码** - 配置信息放入 `config/` 目录
5. **禁止魔数** - 使用常量代替
