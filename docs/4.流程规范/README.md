# 流程规范

> 团队协作流程和最佳实践

## 📚 文档列表

| 文档 | 说明 |
|-----|------|
| [分支管理规范](./分支管理规范.md) | Git 分支命名和操作流程 |
| [PR评审规范](./PR评审规范.md) | 代码评审标准和流程 |
| [发布流程](./发布流程.md) | 版本发布步骤和检查清单 |

---

## 🔄 开发流程

```
需求 → 规格文档 → 编码 → 自测 → Code Review → 合并发布
```

---

## 🌳 分支规范

```
main (生产)
  └── develop (开发)
        ├── feature/xxx (功能)
        ├── fix/xxx (修复)
        └── release/v1.x.x (发布)
```

---

## 📝 Commit 规范

```
{type}: {description}

类型: feat | fix | docs | style | refactor | test | chore
```
