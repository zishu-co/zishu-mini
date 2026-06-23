# 00X-port-{kebab-name}

> **状态**：drafting | **最后更新**：YYYY-MM-DD
> **Vue3 源**：`/root/zishu/frontend/src/views/{子目录}/{Vue文件名}.vue`（{行数} 行）
> **Vue3 路由**：`/{path}`（{query/path 参数}）
> **移植目标**：`/root/zishu-mini/pages/{target}/index.{wxml,ts,wxss,json}`
> **优先级**：P0 / P1 / P2
> **粒度**：移植类（行为对齐 Vue3，UI 适配 TDesign）

---

## 1. 目标

{1-2 句话：移植什么？用户是谁？核心交付物是什么？}

## 2. Vue3 源页面分析

**核心功能**（从 .vue 抽出）：
- {功能 1}（涉及 API / 行为 / 数据）
- {功能 2}
- {功能 3}

**关键交互**：
- {按钮/弹窗/导航等}

**API 依赖**：
- `METHOD /api/xxx` — {一句话}
- `METHOD /api/yyy` — {一句话}

**Vue3 源已验证**：`curl` 后端已通 ✅ / 未通 ❌（附 2026-MM-DD 时间戳）

## 3. 验收标准

> 5-8 条 checkbox，覆盖"页面存在 + 核心功能 + 边界情况 + 微信生态兼容"。

- [ ] 小程序 `pages/{target}/index.{wxml,ts,wxss,json}` 4 个文件齐全
- [ ] `app.json` 已注册新页面
- [ ] {核心功能 1}（具体行为 + 涉及 API）
- [ ] {核心功能 2}
- [ ] {核心功能 3}
- [ ] 登录态/未登录态行为正确（跳登录页 / 游客提示）
- [ ] 错误处理（网络失败、参数缺失、空数据）
- [ ] 微信开发者工具 console 无 error

## 4. 改动清单

**小程序新增**：
- `pages/{target}/index.wxml` — {简述}
- `pages/{target}/index.ts` — {简述}
- `pages/{target}/index.wxss` — {简述}
- `pages/{target}/index.json` — 页面配置

**小程序修改**：
- `app.json` — 注册新页面
- `services/api.ts` — 补充对应 API 封装（如缺）

**后端**：无 / {如需改，列具体路由}

**三端联动**：无（仅小程序端）

## 5. 验证步骤

```bash
# 1. 后端 API 烟测
ssh root@118.25.76.230 "curl -s -H 'token: <JWT>' http://127.0.0.1:8008/api/xxx | head"

# 2. scp 同步到服务器
scp -r /root/work/zishu-mini/pages/{target}/ \
    root@118.25.76.230:/root/zishu-mini/pages/

# 3. 微信开发者工具打开 /root/zishu-mini
#    - 详情 → 不校验合法域名 ✅
#    - 编译 → 预览 → 扫码真机

# 4. 验收清单对照
# 5. git commit
cd /root/zishu-mini
git add pages/{target}/
git commit -m "feat(mini): [spec 00X] port {page name}"
```

## 6. 状态

- [drafting] **drafting** = 起草中
- [ ] **in_progress** = 开发中
- [ ] **done** = 所有验收标准勾完
- [ ] **shipped** = 业务验收通过，移入 archive/

**当前状态**：`drafting`

**变更历史**：
- YYYY-MM-DD：创建初稿

---

## 附录：移植检查点

- [ ] v-if → wx:if，v-for → wx:for（**wx:key 必填**）
- [ ] @click → bindtap
- [ ] :prop → `prop="{{value}}"`
- [ ] axios → `request({...})`
- [ ] localStorage → `wx.storage` API
- [ ] px → rpx（1px ≈ 2rpx @ 750rpx 设计稿）
- [ ] `<style scoped>` → `<style>`（无 scoped）
- [ ] Element Plus 组件 → TDesign 对应组件
- [ ] baseURL 改 `http://118.25.76.230:8008`（**不要 127.0.0.1**）
- [ ] Token header 字段名是 `token`（**不是 `Authorization: Bearer`**）
- [ ] 登录端点用 form-urlencoded（**不是 JSON**）
