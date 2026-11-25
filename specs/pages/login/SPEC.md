# 登录页规格文档（v2.1）

## 1. 目标

处理微信小程序用户的**微信授权登录**与**新用户原地自助注册直登**：
1. 用户授权头像和昵称；
2. 用户授权手机号；
3. **老用户（手机号已存在）**：直接保存双 Token 与用户信息并进入首页（`/pages/aim/index`），无需二次点击停留；
4. **新用户（手机号不存在）**：**不弹出“用户不存在”提示**，**不出现“提交入塾申请”半弹窗表单**，原地平滑展开**性别（男/女）、邮箱、密码（≥6位）**填写项，点击「注册并登录」后直接创建正式账号并登录进入首页。

---

## 2. 验收标准

- [x] **第 1 步（头像与昵称授权）**：提供 `open-type="chooseAvatar"` 获取头像与 `type="nickname"` 获取/填写昵称
- [x] **第 2 步（手机号授权）**：点击「一键授权」调用 `POST /api/users/token_miniprogram` 解密并校验手机号
- [x] **第 3 步（已存在用户直登）**：当 `token_miniprogram` 返回 `200 OK` + `atoken` 时，持久化 `accessToken`/`refreshToken`/`userId`/`userInfo` 并**直接跳转进入首页**
- [x] **第 4 步（未注册用户原地注册直登）**：
  - 当 `token_miniprogram` 返回 `404` 或 `用户不存在` 时，**不弹任何“用户不存在” Toast**，且保留当前 `sessionkey`（不触发 `wx.login` 重置）
  - 在手机号卡片下方**原地出现**填写 **性别（男/女）**、**邮箱**、**密码（≥6位）**，**不出现“提交入塾申请”的半弹窗表单**
  - 点击「注册并登录」调用 `POST /api/users/regi_miniprogram`（并兼容同步密码与完整昵称），返回双 Token 后**直接登录跳转进入首页**
- [x] **全站半弹窗防冒泡铁律**：凡遮罩层（`bindtap="onClose..."`）内嵌的半弹窗卡片，必须绑定有效的空方法 `catchtap="noop"`（严禁写空字符串 `catchtap=""`，因为微信小程序 WXML 对空字符串不绑定事件处理器，会导致点击文本框或卡片任意处冒泡触发遮罩关闭）

---

## 3. 关键路径与接口契约

### 3.1 用户交互状态流

```
进入 /pages/login/login
  ↓
1. 授权头像 (chooseAvatar) + 授权/输入昵称 (type="nickname")
  ↓
2. 一键授权手机号 (getPhoneNumber) → POST /api/users/token_miniprogram
  ├─ 200 OK（用户已存在）
  │    └─ 保存双 Token & 用户信息 → 直接进入首页 /pages/aim/index
  └─ 404 / detail="用户不存在"（新用户）
       └─ 不弹错误提示 → mode 切为 'register'，原地展开：
            • 性别（男 / 女）
            • 邮箱（标准 Email 格式校验）
            • 密码（≥ 6 位）
          ↓
       点击「注册并登录」→ POST /api/users/regi_miniprogram
          ↓
       200 OK → 保存双 Token & 用户信息 → 直接进入首页 /pages/aim/index
```

### 3.2 关联文件与 API

- **小程序端文件**：
  - `pages/login/login.wxml`
  - `pages/login/login.ts`
  - `pages/login/login.wxss`
  - `app.ts`（`checkLoginStatus` 请求序号防竞态覆盖 `sessionkey`）
  - `services/user/user.ts`（`regiMiniProgram`）
- **后端路由（`zishu/backend/app/routers/users.py`）**：
  - `GET /api/users/openid` — `wx.login` code 换取 `session_uuid`
  - `POST /api/users/token_miniprogram` — 手机号解密登录（存在返回 `200 + TokenModel`，不存在返回 `404 + {"message": "用户不存在", "phone": phone}`）
  - `POST /api/users/regi_miniprogram` — 新用户原地注册并直接签发 `atoken` + `rtoken`（支持 `{sessionkey, encryptedData, iv, name, email, gender, password}`）
  - `POST /api/users/token` — 手机号 + 密码登录通道

---

## 4. 状态

- [x] **drafting** / [x] **in_progress** / [x] **done** / [ ] **shipped**

**变更历史**：
- 2026-07-15：v2 初版合并登录与原地注册模式
- 2026-11-25：v2.1 修复 `momo` 分支合并回退问题；恢复无提示原地注册直登流程并补齐性别/邮箱/密码三项与老用户授权直登；彻底移除入塾申请半弹窗；根治全站半弹窗 `catchtap=""` 点击文本框即消失 Bug
