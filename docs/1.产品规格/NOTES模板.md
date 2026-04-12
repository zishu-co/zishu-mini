# 功能开发 NOTES 模板

> 复制此模板到对应页面目录下，命名为 `NOTES.md`

---

```markdown
# [功能名称] 

## 🎯 做什么
一句话描述这个功能要做什么

## 📋 要点
- [ ] 要点1：描述
- [ ] 要点2：描述
- [ ] 要点3：描述

## 🔗 关联
- 关联页面: 
- 关联组件: 
- 关联接口: 

## 📦 涉及文件
- pages/xxx/xxx.ts
- components/xxx/xxx.ts

## 🔄 TODO
- [ ] 
- [ ] 

## ✅ 完成
- [ ]
```

---

## 💡 使用示例

```markdown
# 商品详情页优化

## 🎯 做什么
优化商品详情页的展示，增加规格选择功能

## 📋 要点
- [ ] 展示商品主图、标题、价格
- [ ] 规格选择弹窗
- [ ] 加入购物车按钮

## 🔗 关联
- 关联页面: /pages/event/index (活动页)
- 关联组件: specs-popup
- 关联接口: /api/goods/detail

## 📦 涉及文件
- pages/aim/components/goods-detail/index.ts
- components/specs-popup/index.ts

## 🔄 TODO
- [ ] 完成规格选择逻辑
- [ ] 对接加入购物车接口
- [ ] 添加loading状态

## ✅ 完成
- [x] 页面结构搭建
- [x] 样式编写
```

---

## 📌 提示

- NOTES.md 放在对应页面目录下
- 功能完成后可以删除或保留作为记录
- 复杂功能可以补充更多细节
- 简单功能可以只用一句话描述
