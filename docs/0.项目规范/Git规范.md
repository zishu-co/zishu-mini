# Git 规范（小团队版）

> 简洁实用，适合 3-5 人小团队

---

## 🌳 分支模型

```
main           ← 生产环境代码
  │
  └── develop  ← 开发分支（可选，简单项目可以直接在 main 开发）
       │
       └── feature/功能名  ← 功能分支
```

### 分支命名

```bash
# 功能开发
git checkout -b feature/user-center

# Bug 修复
git checkout -b fix/login-bug

# 快速实验
git checkout -b try/new-design
```

---

## 📝 Commit 规范（简化版）

```
类型: 简短描述

可选的详细说明

类型:
- feat: 新功能
- fix: 修复
- update: 更新/优化
- docs: 文档
- test: 测试
- chore: 其他
```

### 示例

```bash
git commit -m "feat: 添加用户中心页面"

git commit -m "fix: 修复登录页面白屏问题

可能是因为异步加载顺序问题，
增加了一个 loading 状态"
```

---

## 🔄 日常流程

### 1. 开始新功能

```bash
git checkout main
git pull
git checkout -b feature/xxx
```

### 2. 开发完成

```bash
# 提交代码
git add .
git commit -m "feat: 完成xxx功能"

# 推送到远程
git push -u origin feature/xxx
```

### 3. 合并（简化版）

```bash
# 直接合并到 main（简单项目）
git checkout main
git merge feature/xxx

# 或提 PR 让同事看一眼（推荐）
# 然后合并
```

---

## ⚠️ 注意事项

1. **不要在 main 分支直接开发** ❌
2. **大功能先沟通再动手** ✅
3. **合并前确认不影响别人** ✅
4. **commit 信息写清楚** ✅

---

## 🛠️ 常用命令速查

```bash
# 查看状态
git status

# 查看分支
git branch

# 切换分支
git checkout 分支名

# 拉取最新
git pull

# 查看提交历史
git log --oneline
```
