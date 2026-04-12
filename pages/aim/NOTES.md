# aim 页面改版规划

> 填写此文档来规划目标页面的改版方向

---

## 🎯 1. 改版目标

**一句话描述**：
用户在这个页面上能看到自己设定的目标，以及为了实现这个目标最值得做的三件事。

**核心价值**：
是用户的行动指引，帮助用户实现目标。

---

## 📐 2. 页面结构

### 2.1 页面布局

```
┌────────────────────────────────────┐
│           页面头部区域              │
│         最值得做的三件事     │
├────────────────────────────────────┤
│                                    │
│           主内容区域                │
│           用户的目标                │
│                                    │
└────────────────────────────────────┘
```

### 2.2 核心模块

| 模块 | 描述 | 优先级 |
|-----|------|-------|
| top3-recommendation | 今日最值得做的三件事 | P0 |
| goal-card | 用户当前目标展示 | P1 |

---

## 🧩 3. 组件规划

### 3.1 Top3Recommendation 组件（最值得做的三件事）

**参考文件**: `references/RecommendationCard.vue`

**功能需求**：
- 展示推荐列表（最多3项）
- 显示推荐标题、描述、紧急度标签
- 显示预计时间、截止时间、推荐得分
- 推荐理由标签（最多2个）
- 操作按钮（跳转/执行）
- 刷新推荐按钮
- 算法说明弹窗
- 推荐解释弹窗

**简化适配微信小程序**：
- 移除复杂的弹窗，改为 toast 提示
- 简化 meta 信息展示
- 保留核心的：序号、标题、描述、紧急度、操作按钮

**接口数据**：
```typescript
interface RecommendationItem {
  id: string;
  type: string;                    // 推荐类型
  title: string;                   // 推荐标题
  description: string;             // 推荐描述
  action_text: string;             // 操作按钮文字
  action_url: string;              // 操作跳转链接
  score: number;                   // 推荐得分
  urgency_level: string;           // 紧急度：critical/high/medium/low
  estimated_time: string;           // 预计时间
  deadline?: string;                // 截止时间
  reasons: string[];               // 推荐理由
}
```

**待确认**：
- [ ] 推荐接口是否已有？如果没有是用 mock 数据？
- [ ] 推荐得分算法是否已实现？

---

### 3.2 GoalCard 组件（用户目标）

**参考文件**: `references/aim_sample.md`

**功能需求**：
- 展示目标内容（多行文本）
- 显示目标阶段：开始日期 到 截止日期
- 显示目标进度（百分比）
- 显示目标回顾/复盘内容

**数据来源**：
```typescript
interface Goal {
  id: number;
  user_id: number;
  content: string;                  // 目标内容
  start_time?: string;             // 开始时间
  deadline?: string;                // 截止时间
  process: number;                  // 进度 0-100
  end_time?: string;                // 结束时间
  review?: string;                  // 回顾/复盘
}
```

**后端接口（参考）**：
```
GET /api/goals/{user_id}  - 获取用户当前目标
```

---

### 3.3 页面布局详细

```wxml
<!-- pages/aim/index.wxml -->
<view class="aim-page">
  <!-- 顶部：今日推荐 -->
  <view class="section-recommendation">
    <top3-recommendation 
      recommendations="{{recommendations}}"
      bind:refresh="onRefreshRecommendation"
    />
  </view>

  <!-- 主内容：当前目标 -->
  <view class="section-goal">
    <goal-card 
      goal="{{currentGoal}}"
      bind:edit="onEditGoal"
      bind:updateProgress="onUpdateProgress"
    />
  </view>
</view>
```

---

## 💾 4. 数据需求

### 4.1 接口规划

| 接口 | 方法 | 描述 | 状态 |
|-----|------|-----|-----|
| `/api/goals/{user_id}` | GET | 获取用户当前目标 | 参考后端已有 |
| `/api/recommendations/top3` | GET | 获取推荐列表 | 待确认 |
| `/api/goals/{id}/progress` | PUT | 更新目标进度 | 待开发 |

### 4.2 页面状态

```typescript
interface IPageData {
  // 推荐数据
  recommendations: RecommendationItem[];
  recommendationLoading: boolean;

  // 目标数据
  currentGoal: Goal | null;
  goalLoading: boolean;
}
```

---

## ⚠️ 5. 待确认问题

- [ ] 推荐接口是否已实现？后端返回数据结构？
- [ ] 推荐算法权重配置？
- [ ] 如果没有目标，显示什么？（空状态/引导创建）
- [ ] 进度如何更新？（手动输入/完成任务自动更新）
- [ ] 是否需要目标创建/编辑功能？

---

## 📅 6. 实施计划

| 阶段 | 内容 | 依赖 | 状态 |
|-----|------|-----|-----|
| 1 | 创建 GoalCard 组件 + 获取目标数据 | 无 | ✅ 已完成 |
| 2 | 创建 Top3Recommendation 组件 | 无 | ✅ 已完成 |
| 3 | 页面组装和样式调整 | 阶段1、2 | ✅ 已完成 |
| 4 | 添加交互逻辑（刷新、更新进度） | 阶段3 | ✅ 已完成 |
| 5 | 对接后端接口（如果已实现） | 后端配合 | ⏳ 待后端 |

---

## 📝 备注

### 已完成
- 2026-04-12: 完成前端页面开发，使用 Mock 数据
- 组件已创建：top3-recommendation、goal-card
- 支持下拉刷新、操作按钮、进度更新等交互

### 待开发
- 后端接口对接（goals API、recommendations API）
- 目标创建/编辑功能
- 进度自动更新逻辑

