# 登录页规格文档（v2）

## 1. 概述

- **功能描述**: 处理用户微信登录、手机号授权，并支持新用户自助注册
- **业务背景**:
  - 已注册用户走微信登录 → 完成授权 → 进入首页
  - 未注册用户首次访问 → 自动切到注册模式（v2 改造）→ 填写昵称/邮箱/性别 → 注册成功 → 进入首页
- **优先级**: P0
- **版本**: v2（新增注册模式）

## 2. 页面结构

| 页面 | 路由 | 说明 |
|-----|------|-----|
| 登录页 | `/pages/login/login` | 非 TabBar 页面，支持 mode 状态切换 |

## 3. 功能需求

### 3.1 核心功能（v1 保留）

| 功能点 | 描述 | 验收标准 |
|-------|------|---------|
| 微信登录 | 获取用户微信信息 | 获取头像和昵称 |
| 手机号授权 | 绑定用户手机号 | 获取加密手机号 |
| 登录状态检查 | 检查是否已登录 | 已登录跳转首页 |
| Dev 模式登录 | 手机号 + 密码登录（仅 Dev 环境） | 输入合法凭据可登录 |
| 游客模式 | Dev 环境跳过登录 | 可浏览演示数据 |

### 3.2 v2 新增：注册模式

| 功能点 | 描述 | 验收标准 |
|-------|------|---------|
| 自动触发注册 | 当 `token_miniprogram` 返回 404 或 `用户不存在` 时 | 自动切换到注册模式，不弹 toast |
| 昵称输入 | 用户输入昵称（1-20 字） | 校验非空 + 长度限制 |
| 邮箱输入 | 用户输入邮箱 | 校验邮箱格式 |
| 性别选择 | 用户选择男/女 | 必选 |
| 隐私政策勾选 | 用户必须勾选协议才能提交 | 与登录模式复用 |
| 注册提交 | 调用 `/api/users/regi_miniprogram` | 成功后自动登录 + 跳首页 |
| 返回登录 | 注册模式下可返回登录模式 | 清空所有注册字段 |

### 3.3 用户交互流程（v2）

```
进入登录页
    ↓
Dev 模式 + 已登录 → 跳转首页
    ↓
选择登录方式（Dev 模式 radio）
    ↓
微信授权登录 OR 手机号密码登录（Dev）
    ↓
调用 /api/users/token_miniprogram
    ↓
    ├─ 200 OK → 保存 token → 跳首页
    └─ 404 / 用户不存在 → 切到注册模式（v2 新增）
                              ↓
                          填写昵称/邮箱/性别
                              ↓
                          勾选隐私协议
                              ↓
                          提交 /api/users/regi_miniprogram
                              ↓
                          成功 → 保存 token → 跳首页
                          失败 → 显示错误提示
```

## 4. 数据模型

### 4.1 全局状态（v1 保留）

```typescript
// app.ts globalData
interface GlobalData {
  userInfo: any;
  hasUserInfo: boolean;
  phoneNumber: string;
  hasPhoneNumber: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  openid: string | null;
  sessionkey: string | null;  // v2 改造：现在存 UUID
  code: string | null;
}
```

### 4.2 页面状态（v2 新增）

```typescript
type ILoginPageData = {
  // v1 字段（保留）
  userInfo: any;
  hasUserInfo: boolean;
  phoneNumber: string;
  hasPhoneNumber: boolean;
  avatarUrl: string | null;
  nickName: string | null;
  userId: number | null;
  isDev: boolean;
  loginMethod: 'wechat' | 'password';
  phoneInput: string;
  pwdInput: string;
  canDevLogin: boolean;
  privacyAgreed: boolean;

  // v2 改造：注册模式字段
  mode: 'login' | 'register';
  regName: string;
  regEmail: string;
  regGender: 'male' | 'female' | '';
  regNameError: string;
  regEmailError: string;
  regGenderError: string;
  canRegister: boolean;
  regSubmitting: boolean;
  regErrorMsg: string;
  _pendingRegiData: any;  // 内部字段
};
```

### 4.3 API 接口

| 接口 | 方法 | 描述 | v2 改造 |
|-----|------|-----|---------|
| `/api/users/openid` | POST | 通过 code 获取 openid，返回 UUID sessionkey | - |
| `/api/users/token_miniprogram` | POST | 手机号授权登录 | 404 时不弹 toast，切注册模式 |
| `/api/users/token` | POST | 手机号+密码登录（Dev） | - |
| `/api/users/regi_miniprogram` | POST | **v2 新增** 小程序注册 | body: `{sessionkey, miniProgramToken, name, email, gender}` |

### 4.4 注册接口请求/响应

**请求**:
```json
POST /api/users/regi_miniprogram
{
  "sessionkey": "uuid-string",         // app.globalData.sessionkey
  "miniProgramToken": "token-string",  // token_miniprogram 返回的 miniProgramToken
  "name": "用户昵称",
  "email": "user@example.com",
  "gender": "male" | "female"
}
```

**成功响应**（200 OK）:
```json
{
  "id": 123,
  "phone": "13800138000",
  "atoken": "...",
  "rtoken": "..."
}
```

## 5. 验收标准

### 5.1 v1 验收（保留）

- [ ] 页面正常显示登录按钮
- [ ] 微信授权成功获取用户信息
- [ ] 手机号授权成功获取手机号
- [ ] 登录信息正确保存到全局状态
- [ ] 登录完成后正确跳转

### 5.2 v2 新增验收

- [ ] 当后端返回 `用户不存在` 时，**不弹 toast**，自动切到注册模式
- [ ] 注册模式下，昵称为空时显示「请输入昵称」错误
- [ ] 注册模式下，邮箱格式不正确时显示「邮箱格式不正确」错误
- [ ] 注册模式下，未选择性别时显示「请选择性别」错误
- [ ] 注册按钮在所有字段合法 + 隐私协议勾选后才可点
- [ ] 注册成功后自动保存 token 并跳转首页
- [ ] 注册失败时显示错误提示
- [ ] 「返回登录」链接可清空注册字段并切回登录模式

## 6. 状态

- **开发状态**: ✅ v2 已完成（前端 + 后端）
- **最后更新**: 2026-07-15 v2 改造（注册模式合并）
- **相关文档**:
  - 后端: `app/routers/users.py` 中 `regi_miniprogram` 接口
  - 服务: `services/user/user.ts` 中 `regiMiniProgram` 函数