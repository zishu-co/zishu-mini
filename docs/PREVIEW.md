# 手机预览小程序 - 设置指南

## 工作原理

代码改动 → 推送到 GitHub preview 分支 → GitHub Actions 自动运行 miniprogram-ci → 生成二维码 → 微信扫码预览

## 你需要做的

### 第一步：配置 GitHub Secrets

1. 打开 https://github.com/zishu-co/zishu-mini/settings/secrets/actions

2. 添加以下 Secrets：

| Secret 名称 | 值从哪里来 |
|------------|-----------|
| WX_MINI_APPID | wxb733ab430ac1a423（已确认） |
| WX_MINI_PRIVATE_KEY | 微信公众平台 → 开发管理 → 开发设置 → 小程序代码上传密钥，点"生成"后下载私钥文件，复制文件内容粘贴 |
| FEISHU_WEBHOOK | 飞书群机器人 WebHook（可选） |

3. 配置 IP 白名单：在微信公众平台开启"IP白名单"后，把 GitHub Actions 的 IP 段加入白名单

### 第二步：推送代码触发预览

以后开发流程：

```bash
cd /root/zishu-mini
./scripts/push-preview.sh '修复了目标页面进度条bug'
```

### 第三步：扫码预览

1. GitHub Actions 完成后，去 Actions 页面下载 preview-qrcode artifacts
2. 用微信扫描二维码即可在真机上预览
