# 目录结构规范

> 定义项目的目录组织方式和文件命名规范。

---

## 📂 完整目录结构

```
miniprogram-2/
│
├── 📁 pages/                      # 页面目录
│   ├── 📁 index/                  # 学习/首页
│   │   ├── index.ts               # 页面逻辑
│   │   ├── index.wxml             # 页面结构
│   │   ├── index.wxss             # 页面样式
│   │   ├── index.json              # 页面配置
│   │   ├── 📁 components/          # 页面私有组件
│   │   └── 📁 utils/               # 页面私有工具
│   │
│   ├── 📁 inno/                   # 创新
│   ├── 📁 aim/                    # 目标
│   ├── 📁 event/                  # 活动
│   ├── 📁 my/                     # 我的
│   ├── 📁 login/                  # 登录
│   ├── 📁 logs/                   # 日志
│   └── 📁 test/                   # 测试
│
├── 📁 components/                 # 全局通用组件
│   ├── 📁 goods-card/
│   ├── 📁 goods-list/
│   ├── 📁 load-more/
│   ├── 📁 price/
│   ├── 📁 swipeout/
│   └── 📁 webp-image/
│
├── 📁 services/                   # 服务层
│   ├── base.ts                    # 基础配置
│   ├── _utils/                    # 工具函数
│   │   ├── delay.ts
│   │   └── timeout.ts
│   ├── aim/                       # 目标模块
│   ├── event/                     # 活动模块
│   ├── good/                      # 商品模块
│   └── inno/                      # 创新模块
│
├── 📁 custom-tab-bar/             # 自定义导航栏
│
├── 📁 utils/                      # 全局工具函数
│
├── 📁 config/                     # 配置文件
│
├── 📁 img/                        # 静态图片资源
│
├── 📁 docs/                       # 规范文档
│   ├── README.md
│   ├── 0.项目规范/
│   ├── 1.产品规格/
│   ├── 2.技术架构/
│   ├── 3.组件规范/
│   └── 4.流程规范/
│
├── app.ts                         # 应用入口
├── app.json                       # 应用配置
├── app.wxss                       # 全局样式
├── project.config.json            # 项目配置
├── package.json                   # 依赖配置
└── tsconfig.json                  # TypeScript 配置
```

---

## 📋 命名规范汇总

| 类型 | 规范 | 示例 |
|-----|------|-----|
| 页面目录 | kebab-case | `goods-detail/` |
| 组件目录 | kebab-case | `goods-card/` |
| 服务目录 | kebab-case | `fetch-goods/` |
| 页面/组件文件 | index | `index.ts/wxml/wxss/json` |
| 工具文件 | kebab-case | `format-date.ts` |
| 类型文件 | `{模块}.types.ts` | `user.types.ts` |

---

## 📁 各目录职责

### pages/ - 页面目录

**规则：**
- 每个页面必须是一个独立目录
- 必须包含 `index.ts`, `index.wxml`, `index.wxss`, `index.json`
- 页面私有组件放在 `components/` 子目录
- 页面私有工具放在 `utils/` 子目录

### components/ - 全局组件

**规则：**
- 仅包含全局可复用的组件
- 组件必须有完整的类型定义
- 组件需在 `docs/3.组件规范/组件库清单.md` 中登记

### services/ - 服务层

**规则：**
- 按业务模块划分目录
- 每个服务文件只负责一个功能
- API 请求统一封装在 `_utils/request.ts`

### docs/ - 文档目录

**规则：**
- 规范文档与代码分离
- 定期更新文档与代码的同步性
