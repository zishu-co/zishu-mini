# 技术架构设计

> 定义项目的整体技术架构和技术选型。

---

## 🏗️ 技术栈

| 层级 | 技术 | 版本 | 说明 |
|-----|------|------|-----|
| 框架 | 微信小程序 | - | 宿主框架 |
| 语言 | TypeScript | 5.x | 类型安全 |
| UI组件 | TDesign Miniprogram | 1.12.x | 腾讯企业级组件库 |
| 状态管理 | 小程序原生的 globalData | - | 轻量级状态共享 |
| 本地存储 | wx.setStorageSync | - | 本地数据持久化 |

---

## 📁 分包策略

### 当前分包结构

```
┌─────────────────────────────────────┐
│              主包 (2.2MB)            │
├─────────────────────────────────────┤
│  app.json                            │
│  app.ts                              │
│  app.wxss                            │
│  custom-tab-bar/                     │
│  components/ (全局组件)               │
│  services/ (服务层)                  │
│  utils/ (工具函数)                    │
│  img/ (公共图片)                      │
├─────────────────────────────────────┤
│  pages/ (所有页面)                    │
│  - pages/index/                      │
│  - pages/inno/                       │
│  - pages/aim/                        │
│  - pages/event/                      │
│  - pages/my/                         │
│  - pages/login/                      │
│  - pages/logs/                       │
│  - pages/test/                       │
└─────────────────────────────────────┘
```

### 建议优化结构（未来）

```
├── 主包                          # 基础依赖和核心页面
│   ├── app.ts/json/wxss
│   ├── custom-tab-bar/
│   ├── components/               # 全局通用组件
│   ├── services/_utils/          # 基础服务工具
│   └── pages/index/              # 首页
│
├── 页面分包（按业务模块）
│   ├── page-aim/                 # 目标模块
│   ├── page-event/               # 活动模块
│   └── page-user/                # 用户中心模块
```

---

## 🔧 核心模块设计

### 1. 全局数据管理 (app.ts)

```typescript
// 全局数据结构
interface GlobalData {
  userInfo: IUserInfo | null;      // 用户信息
  hasUserInfo: boolean;            // 是否已获取用户信息
  phoneNumber: string;            // 手机号
  hasPhoneNumber: boolean;         // 是否已绑定手机号
  accessToken: string | null;      // 访问令牌
  refreshToken: string | null;     // 刷新令牌
  openid: string | null;           // 微信 openid
  sessionkey: string | null;       // 会话密钥
  code: string | null;             // 登录 code
}
```

### 2. 服务层结构 (services/)

```
services/
├── _utils/                       # 工具函数
│   ├── delay.ts                  # 延迟工具
│   └── timeout.ts                # 超时工具
├── base.ts                       # 基础配置和请求封装
├── aim/                          # 目标模块
│   ├── fetchPerson.ts            # 获取个人信息
│   └── fetchUsercenter.ts        # 获取用户中心数据
├── cart/                         # 购物车模块
│   └── cart.ts                   # 购物车服务
├── good/                         # 商品模块
│   └── fetchGoods.ts             # 商品服务
└── home/                         # 首页模块
    └── home.ts                   # 首页服务
```

### 3. 组件层级

```
components/                       # 全局通用组件
├── goods-card/                   # 商品卡片
├── goods-list/                   # 商品列表
├── load-more/                    # 加载更多
├── price/                        # 价格展示
├── swipeout/                     # 滑动操作
└── webp-image/                   # WebP 图片

页面私有组件（各页面目录下）
├── aim/
│   ├── components/
│   │   ├── order-group/
│   │   ├── ui-select-picker/
│   │   └── user-center-card/
│   └── address/edit/
├── event/
│   └── components/
│       ├── cart-group/
│       ├── goods-card/
│       └── specs-popup/
└── my/
    └── components/
        ├── order-group/
        └── user-center-card/
```

---

## 🌐 API 规范

### 基础配置

```typescript
// 本地开发
const API_BASE_URL = 'http://127.0.0.1:8008';

// 生产环境
// const API_BASE_URL = 'https://api.zishu.co';
```

### 接口列表

| 模块 | 接口路径 | 方法 | 描述 |
|-----|---------|------|------|
| 用户 | `/api/users/openid` | POST | 获取 openid |
| 首页 | `/api/ques/fetchpapers/` | POST | 获取试卷列表 |
| 商品 | `/api/goods/*` | GET/POST | 商品相关接口 |
| 购物车 | `/api/cart/*` | GET/POST/PUT/DELETE | 购物车接口 |

### 请求封装

```typescript
// services/_utils/request.ts
interface IRequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
}

interface IResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

export function request<T>(config: IRequestConfig): Promise<T> {
  return new Promise((resolve, reject) => {
    wx.request({
      url: API_BASE_URL + config.url,
      method: config.method || 'GET',
      data: config.data,
      header: {
        'content-type': 'application/json',
        ...config.header
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data as T);
        } else {
          reject(res);
        }
      },
      fail: reject
    });
  });
}
```

---

## 🔐 安全规范

1. **敏感数据存储**
   - 用户 token 存储在 `wx.setStorageSync` 中
   - 敏感信息（如 openid）不直接暴露在前端

2. **接口鉴权**
   - 请求头携带 `Authorization` 字段
   - token 过期时自动刷新

3. **登录态检查**
   - 每次进入需要登录的页面时检查登录态
   - 未登录自动跳转登录页

---

## 📦 第三方依赖

| 依赖 | 版本 | 用途 |
|-----|------|-----|
| tdesign-miniprogram | ^1.12.2 | UI 组件库 |
| miniprogram-api-typings | ^5.1.2 | TypeScript 类型声明 |

---

## 🔄 更新记录

| 日期 | 版本 | 更新内容 | 作者 |
|-----|------|---------|------|
| 2024-01-01 | v1.0 | 初始架构设计 | - |
