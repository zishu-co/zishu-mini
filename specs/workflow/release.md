# 发布流程规范

> 规范版本发布流程，确保发布的安全性和可追溯性。

---

## 📋 发布前检查

### 代码检查

- [ ] 代码已通过 CI 检查
- [ ] 无未解决的 lint 警告
- [ ] TypeScript 编译无错误

### 测试检查

- [ ] 功能测试完成
- [ ] 已在测试环境验证
- [ ] 回归测试通过

### 文档检查

- [ ] CHANGELOG 已更新
- [ ] 版本号已更新
- [ ] API 文档已更新（如有变更）

---

## 🔄 发布流程

### 1. 准备发布

```bash
# 1. 确保 develop 分支最新
git checkout develop
git pull origin develop

# 2. 创建发布分支
git checkout -b release/v1.x.x
```

### 2. 合并代码

```bash
# 3. 合并功能分支到 release
git merge feature/xxx

# 4. 解决冲突（如有）
# 5. 推送发布分支
git push origin release/v1.x.x
```

### 3. 发布审核

1. 在微信公众平台提交审核
2. 填写版本说明
3. 等待审核通过

### 4. 发布上线

1. 审核通过后发布
2. 监控发布状态
3. 确认功能正常

### 5. 完成发布

```bash
# 合并到 main
git checkout main
git merge release/v1.x.x
git tag v1.x.x
git push origin main --tags

# 合并回 develop
git checkout develop
git merge release/v1.x.x
git push origin develop

# 删除分支
git branch -d release/v1.x.x
```

---

## 📝 版本号规范

```
主版本号.次版本号.修订号

示例: v1.0.0

- 主版本号: 不兼容的 API 变更
- 次版本号: 向后兼容的功能新增
- 修订号: 向后兼容的问题修复
```

---

## ⚠️ 紧急发布

如遇紧急 Bug 需要快速修复：

1. 从 main 创建 hotfix 分支
2. 修复并测试
3. 快速审核发布
4. 合并回 main 和 develop
