# Git 分支管理规范

> 统一分支命名和操作流程，确保团队协作效率。

---

## 🌳 分支结构

```
main (主分支 - 生产环境)
│
├── develop (开发分支 - 开发环境)
│   │
│   ├── feature/xxx       # 功能开发分支
│   ├── fix/xxx           # 修复分支
│   ├── refactor/xxx      # 重构分支
│   └── docs/xxx          # 文档更新分支
│
└── release/v1.x.x        # 发布分支 (按需创建)
```

---

## 📋 分支命名规范

| 分支类型 | 命名格式 | 示例 |
|---------|---------|------|
| 功能分支 | `feature/{功能名}` | `feature/login-flow` |
| 修复分支 | `fix/{问题描述}` | `fix/user-info-bug` |
| 重构分支 | `refactor/{模块名}` | `refactor/cart-module` |
| 文档分支 | `docs/{文档类型}` | `docs/sdd-spec` |
| 发布分支 | `release/{版本号}` | `release/v1.0.0` |

---

## 🔄 开发流程

### 1. 创建功能分支

```bash
# 从 develop 创建新功能分支
git checkout develop
git pull origin develop
git checkout -b feature/user-center
```

### 2. 开发与提交

```bash
# 提交代码 (遵循 commit 规范)
git add .
git commit -m "feat: 添加用户中心页面"
```

### 3. 提交规范

```
{type}: {description}

[可选的详细说明]

类型说明:
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式
- refactor: 重构
- test: 测试相关
- chore: 构建/工具相关
```

### 4. 推送到远程

```bash
# 首次推送
git push -u origin feature/user-center

# 后续推送
git push
```

### 5. 合并请求 (Merge Request)

1. 在 Git 平台创建 MR/PR
2. 填写 MR 模板
3. 指定 Reviewer
4. 关联相关 Issue

---

## ✅ 合并标准

合并到 `develop` 需要：

- [ ] 代码通过 lint 检查
- [ ] 功能测试通过
- [ ] 至少 1 人 Review 通过
- [ ] 无未解决的评论

合并到 `main` 需要：

- [ ] 完整的测试用例
- [ ] 至少 2 人 Review 通过
- [ ] 产品/PM 验收通过
- [ ] 更新版本号

---

## ⚠️ 注意事项

1. **禁止直接 push 到 main/develop**
2. **禁止在 develop 分支直接开发**
3. **合并前必须先 rebase develop**
4. **解决冲突后重新测试**
