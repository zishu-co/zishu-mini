const ci = require("miniprogram-ci");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const crypto = require("crypto");

(async () => {
  const appid = process.env.APPID;
  const privateKeyRaw = (process.env.PRIVATE_KEY || "").trim();
  const appSecret = (process.env.APP_SECRET || "").trim();
  const projectPath = process.env.PROJECT_PATH;

  if (!appid || !privateKeyRaw || !projectPath) {
    console.error("Missing required env vars: APPID, PRIVATE_KEY, PROJECT_PATH");
    process.exit(1);
  }

  // 统一样式化为多行 PEM
  let pemKey = privateKeyRaw;
  if (!pemKey.includes("\n") && pemKey.includes("-----BEGIN")) {
    let header, footer;
    if (pemKey.includes("-----BEGIN PRIVATE KEY-----")) {
      header = "-----BEGIN PRIVATE KEY-----"; footer = "-----END PRIVATE KEY-----";
    } else if (pemKey.includes("-----BEGIN RSA PRIVATE KEY-----")) {
      header = "-----BEGIN RSA PRIVATE KEY-----"; footer = "-----END RSA PRIVATE KEY-----";
    } else {
      console.error("Unknown key format");
      process.exit(1);
    }
    const body = pemKey.replace(header, "").replace(footer, "");
    const lines = body.match(/.{1,64}/g) || [];
    pemKey = header + "\n" + lines.join("\n") + "\n" + footer;
    console.log("密钥已格式化");
  }

  // 如果是 PKCS#8 格式 (BEGIN PRIVATE KEY)，转换为 PKCS#1 (BEGIN RSA PRIVATE KEY)
  // GitHub Actions runner 使用 OpenSSL 3.x，需要 PKCS#1 格式
  const privateKeyPath = path.join(projectPath, "private.key");
  const privateKeyPKCS1Path = path.join(projectPath, "private_pkcs1.key");

  if (pemKey.includes("-----BEGIN PRIVATE KEY-----")) {
    console.log("检测到 PKCS#8 格式，转换为 PKCS#1...");
    try {
      fs.writeFileSync(privateKeyPath, pemKey);
      fs.chmodSync(privateKeyPath, 0o600);
      execSync(`openssl rsa -in ${privateKeyPath} -out ${privateKeyPKCS1Path}`, { timeout: 10000 });
      fs.chmodSync(privateKeyPKCS1Path, 0o600);
      fs.unlinkSync(privateKeyPath);
      // 使用转换后的 PKCS#1 密钥
      const pkcs1Key = fs.readFileSync(privateKeyPKCS1Path, "utf8");
      fs.writeFileSync(privateKeyPath, pkcs1Key);
      fs.unlinkSync(privateKeyPKCS1Path);
      console.log("PKCS#1 转换成功");
    } catch (e) {
      console.error("PKCS#1 转换失败:", e.message);
      process.exit(1);
    }
  } else {
    fs.writeFileSync(privateKeyPath, pemKey);
    fs.chmodSync(privateKeyPath, 0o600);
  }

  const project = new ci.Project({
    appid,
    type: "miniProgram",
    projectPath,
    privateKey: privateKeyPath,
  });

  const qrcodeOutputPath = path.resolve(projectPath, "preview-qrcode.png");

  console.log("开始预览...");
  console.log("appid:", appid);
  console.log("projectPath:", projectPath);

  const previewOptions = {
    project,
    desc: "预览发布 - " + new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
    setting: { es6: true, enhance: true, postcss: true, minified: true },
    qrcodeFormat: "image",
    qrcodeOutputDest: qrcodeOutputPath,
  };

  // 优先使用 APP_SECRET（access_token 模式），其次 RSA 私钥签名
  if (appSecret) {
    previewOptions.appSecret = appSecret;
    console.log("使用 APP_SECRET 进行 access_token 认证");
  } else {
    console.log("使用 RSA 私钥进行本地签名认证");
  }

  const previewResult = await ci.preview(previewOptions);
  console.log("预览结果:", JSON.stringify(previewResult, null, 2));
  console.log("二维码已生成:", qrcodeOutputPath);

  try { fs.unlinkSync(privateKeyPath); } catch (e) { /* ignore */ }
})();
