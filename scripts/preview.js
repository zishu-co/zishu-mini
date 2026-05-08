const ci = require("miniprogram-ci");
const fs = require("fs");
const path = require("path");

(async () => {
  const appid = process.env.APPID;
  let privateKey = process.env.PRIVATE_KEY;
  const projectPath = process.env.PROJECT_PATH;

  if (!appid || !privateKey || !projectPath) {
    console.error("Missing required env vars: APPID, PRIVATE_KEY, PROJECT_PATH");
    process.exit(1);
  }

  privateKey = privateKey.trim();

  // 格式化单行 PEM
  if (!privateKey.includes("\n") && privateKey.includes("-----BEGIN")) {
    let header, footer;
    if (privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      header = "-----BEGIN PRIVATE KEY-----"; footer = "-----END PRIVATE KEY-----";
    } else {
      header = "-----BEGIN RSA PRIVATE KEY-----"; footer = "-----END RSA PRIVATE KEY-----";
    }
    const body = privateKey.replace(header, "").replace(footer, "");
    const lines = body.match(/.{1,64}/g) || [];
    privateKey = header + "\n" + lines.join("\n") + "\n" + footer;
    console.log("Key formatted to multi-line PEM");
  }

  // 写入密钥文件
  const privateKeyPath = path.join(projectPath, "private.key");
  fs.writeFileSync(privateKeyPath, privateKey);
  fs.chmodSync(privateKeyPath, 0o600);

  const project = new ci.Project({
    appid,
    type: "miniProgram",
    projectPath,
    privateKey: privateKeyPath,
  });

  const qrcodeOutputPath = path.resolve(projectPath, "preview-qrcode.png");

  console.log("Starting preview...");
  console.log("appid:", appid);
  console.log("projectPath:", projectPath);

  const previewResult = await ci.preview({
    project,
    desc: "Preview - " + new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
    setting: { es6: true, enhance: true, postcss: true, minified: true },
    qrcodeFormat: "image",
    qrcodeOutputDest: qrcodeOutputPath,
  });

  console.log("Preview result:", JSON.stringify(previewResult, null, 2));
  console.log("QR code generated:", qrcodeOutputPath);

  try { fs.unlinkSync(privateKeyPath); } catch (e) { /* ignore */ }
})();
