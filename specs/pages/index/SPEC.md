# 首页规格文档

## 1. 概述

- **功能描述**: 展示学习内容和试卷列表，是用户进入小程序的默认页面
- **业务背景**: 作为学习平台的核心入口，提供内容浏览和快速访问功能
- **优先级**: P0

## 2. 页面结构

| 页面 | 路由 | 说明 |
|-----|------|-----|
| 首页 | `/pages/index/index` | 默认 TabBar 页面 |

### 页面布局

```
┌────────────────────────┐
│      顶部 TabBar        │  ← 自定义 TabBar (5个Tab)
├────────────────────────┤
│                        │
│    页面内容区域         │  ← 动态内容
│                        │
│  ┌──────────────────┐  │
│  │   试卷/内容列表   │  │
│  │   - item 1       │  │
│  │   - item 2       │  │
│  │   - ...          │  │
│  └──────────────────┘  │
│                        │
└────────────────────────┘
```

## 3. 功能需求

### 3.1 核心功能

| 功能点 | 描述 | 验收标准 |
|-------|------|---------|
| 试卷列表 | 展示学习试卷内容 | 从 API 获取并展示 |
| 用户信息 | 显示用户头像和昵称 | 已登录时显示 |
| TabBar 切换 | 切换到其他 Tab | 正常响应 |
| 下拉刷新 | 下拉刷新列表 | 数据重新加载 |

### 3.2 用户交互流程

```
进入页面 → 初始化 TabBar → 加载试卷数据 → 展示列表
     ↓
用户下拉 → 重新加载数据
     ↓
点击 TabBar → 切换页面
```

## 4. 数据模型

### 4.1 页面状态

```typescript
interface IPageData {
  paperdata: any[];                    // 试卷数据列表
  userInfo: any;                       // 用户信息
  value: string;                       // 当前 Tab 值
  list: { value: string; label: string; icon: string }[];  // Tab 列表
  hasUserInfo: boolean;               // 是否有用户信息
  canIUse: boolean;                   // 是否可以使用 button.open-type.getUserInfo
  canIUseGetUserProfile: boolean;      // 是否可以使用 getUserProfile
  canIUseOpenData: boolean;            // 是否可以使用 open-data
}
```

### 4.2 API 调用

| 接口 | 方法 | 描述 |
|-----|------|-----|
| `https://zishu.co/api/ques/fetchpapers/` | POST | 获取试卷列表 |

## 5. 技术实现

### 5.1 文件位置

```
pages/index/
├── index.ts        # 页面逻辑
├── index.wxml     # 页面结构
├── index.wxss     # 页面样式
└── index.json     # 页面配置
```

### 5.2 关键代码片段

```typescript
// 初始化 TabBar
onShow() {
  this.getTabBar().init();
}

// 获取试卷数据
onLoad() {
  wx.request({
    url: 'https://zishu.co/api/ques/fetchpapers/',
    method: 'POST',
    success: (res) => {
      this.setData({ paperdata: res.data });
    }
  });
}
```

## 6. 验收标准

- [ ] 页面正常加载，显示试卷列表
- [ ] TabBar 正常显示和切换
- [ ] 用户信息正确获取和展示
- [ ] 支持下拉刷新
- [ ] 支持页面分享
- [ ] TypeScript 类型完整

## 7. 状态

- **开发状态**: ✅ 已完成
- **最后更新**: 初始版本
