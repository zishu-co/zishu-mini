# 自塾小程序源代码

自塾官方小程序源码

## 功能特性

- 学习课程
- 考试认证

## 技术栈

原生微信小程序框架 + Tdesign组件库


开源贡献者：

稳新
子瑜
四维

# 运行指南

## 第一步：找管理员在后台添加您为开发者，因为登录认证功能需要开发者权限

## 第二步：安装TS插件
```bash
npm install -D typescript miniprogram-api-typings
```
参数说明：

-D（或 --save-dev）：将其安装到 devDependencies 中（开发依赖），因为类型定义只在开发时需要

## 第三步：npm 构建，点微信开发者工具的菜单栏 工具，然后点 构建 npm
构建完毕后，会在根目录生成  miniprogram_npm文件夹，里面是 tdesign-miniprogram

## 第四步：编译预览即可