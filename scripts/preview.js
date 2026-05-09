const ci = require("miniprogram-ci");
const fs = require("fs");
const path = require("path");

(async () => {
  const appid = process.env.APPID;
  const privateKeyRaw = (process.env.PRIVATE_KEY || "").trim();
  const appSecret = (process.env.APP_SECRET || "").trim();
  const projectPath = process.env.PROJECT_PATH;

  if (!appid || !privateKeyRaw || !projectPath) {
    console.error("Missing required env vars: APPID, PRIVATE_KEY, PROJECT_PATH");
    process.exit(1);
  }

  // 格式化 PEM
  let pemKey = privateKeyRaw;
  if (!pemKey.includes("\n") && pemKey.includes("-----BEGIN")) {
    let header, footer;
    if (pemKey.includes("-----BEGIN PRIVATE KEY-----")) {
      header = "-----BEGIN PRIVATE KEY-----"; footer = "-----END PRIVATE KEY-----";
    } else {
      header = "-----BEGIN RSA PRIVATE KEY-----"; footer = "-----END RSA PRIVATE KEY-----";
    }
    const body = pemKey.replace(header, "").replace(footer, "");
    const lines = body.match(/.{1,64}/g) || [];
    pemKey = header + "\n" + lines.join("\n") + "\n" + footer;
  }

  const privateKeyPath = path.join(projectPath, "private.key");
  fs.writeFileSync(privateKeyPath, pemKey);
  fs.chmodSync(privateKeyPath, 0o600);

  const project = new ci.Project({
    appid,
    type: "miniProgram",
    projectPath,
    privateKey: privateKeyPath,
  });

  const qrcodeOutputPath = path.resolve(projectPath, "preview-qrcode.png");

  console.log("开始预览...");
  console.log("appid:", appid);

  const previewOptions = {
    project,
    desc: "预览发布 - " + new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
    setting: { es6: true, enhance: true, postcss: true, minified: true },
    qrcodeFormat: "image",
    qrcodeOutputDest: qrcodeOutputPath,
  };

  if (appSecret) {
    previewOptions.appSecret = appSecret;
    console.log("使用 APP_SECRET 认证");
  }

  const result = await ci.preview(previewOptions);
  console.log("预览成功:", JSON.stringify(result, null, 2));

  try { fs.unlinkSync(privateKeyPath); } catch (e) {}
})();
