# API 接口规范

> 统一前后端接口约定，确保接口一致性和可维护性。

---

## 🌐 接口基础规范

### 1. 基础 URL

```typescript
// 开发环境
const API_BASE_URL = 'http://127.0.0.1:8008';

// 生产环境
const API_BASE_URL = 'https://api.zishu.co';
```

### 2. 请求格式

```typescript
// 请求头
{
  'content-type': 'application/json',  // 默认 JSON 格式
  'Authorization': 'Bearer xxx'        // 需要鉴权的接口
}

// 请求方法
GET    - 获取数据
POST   - 创建数据
PUT    - 更新数据
DELETE - 删除数据
```

### 3. 响应格式

```typescript
// 成功响应
{
  "code": 200,
  "data": { /* 业务数据 */ },
  "message": "success"
}

// 失败响应
{
  "code": 400,
  "data": null,
  "message": "参数错误"
}
```

---

## 📋 接口列表

### 用户模块

| 接口 | 方法 | 描述 | 鉴权 |
|-----|------|-----|-----|
| `/api/users/openid` | POST | 通过 code 获取 openid | 否 |
| `/api/users/info` | GET | 获取用户信息 | 是 |
| `/api/users/update` | POST | 更新用户信息 | 是 |

**获取 openid**

```typescript
// 请求
POST /api/users/openid
Content-Type: application/x-www-form-urlencoded

code=xxxxx

// 响应
{
  "openid": "oxxxxxxxx",
  "session_key": "xxxxx"
}
```

### 创新模块

| 接口 | 方法 | 描述 | 鉴权 |
|-----|------|-----|-----|
| `/api/inno/list` | GET | 获取创新内容列表 | 否 |
| `/api/inno/detail` | GET | 获取创新内容详情 | 否 |

**获取创新数据（本地 Mock）**

```typescript
// services/inno/inno.ts
interface InnoData {
  swiper: string[];           // 轮播图列表
  tabList: TabItem[];         // 标签列表
  activityImg: string;        // 活动图片
}

interface TabItem {
  text: string;
  key: number;
}

export function fetchInno(): Promise<InnoData>
```

### 商品模块

| 接口 | 方法 | 描述 | 鉴权 |
|-----|------|-----|-----|
| `/api/goods/list` | GET | 获取商品列表 | 否 |
| `/api/goods/detail` | GET | 获取商品详情 | 否 |

### 活动模块

| 接口 | 方法 | 描述 | 鉴权 |
|-----|------|-----|-----|
| `/api/event/list` | GET | 获取活动列表 | 否 |
| `/api/event/detail` | GET | 获取活动详情 | 否 |

---

## 📝 接口定义文件

所有接口的类型定义应放在 `services/_types/` 目录：

```typescript
// services/_types/api.d.ts

// ========== 通用类型 ==========
interface IApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

// ========== 用户模块 ==========
interface IOpenidResponse {
  openid: string;
  session_key: string;
}

interface IUserInfo {
  id: string;
  name: string;
  avatar: string;
  phone?: string;
}

// ========== 商品模块 ==========
interface IGoodsItem {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
}

// ========== 活动模块 ==========
interface IEventItem {
  id: string;
  title: string;
  description: string;
  image: string;
  startTime: string;
  endTime: string;
}
```

---

## ⚠️ 接口维护规则

1. **新增接口** - 在本文档中添加记录
2. **修改接口** - 更新文档并标注版本
3. **废弃接口** - 标记 `@deprecated` 并保留一段时间
4. **接口文档同步** - 代码更新后 24 小时内更新文档
