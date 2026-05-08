
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const crypto = require("crypto");

// 从环境变量获取私钥并格式化
let privateKey = process.env.PRIVATE_KEY || "";
if (!privateKey && process.env.APPID) {
  console.error("PRIVATE_KEY not set!");
  process.exit(1);
}
privateKey = privateKey.trim();

// 确保 PEM 格式有多行
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
  console.log("密钥格式化为多行 PEM");
}

// 写入临时密钥文件
const projectPath = process.env.PROJECT_PATH || process.cwd();
const keyPath = path.join(projectPath, "private.key");
fs.writeFileSync(keyPath, privateKey);
fs.chmodSync(keyPath, 0o600);

// Monkey-patch crypto.privateEncrypt — 在加载 miniprogram-ci 之前拦截
const originalPrivateEncrypt = crypto.privateEncrypt.bind(crypto);
crypto.privateEncrypt = function(key, data, callback) {
  const keyStr = (typeof key === "string" ? key : (key && key.key)) || privateKey;
  const dataStr = data.toString("utf8");
  try {
    // 写密钥到文件
    fs.writeFileSync(keyPath, keyStr);
    // 用 openssl dgst -sign 做真正的 RSA PKCS#1 签名
    const sig = execSync(
      "openssl dgst -sha1 -sign " + keyPath,
      { input: Buffer.from(dataStr), timeout: 30000 }
    );
    const result = Buffer.from(sig.toString("base64"), "base64");
    if (typeof callback === "function") callback(null, result);
    return result;
  } catch (e) {
    if (typeof callback === "function") callback(e);
    else throw e;
  }
};
console.log("crypto.privateEncrypt 已替换为 openssl dgst -sign");

// 加载 miniprogram-ci（在 patch 之后）
const ci = require("miniprogram-ci");

const project = new ci.Project({
  appid: process.env.APPID,
  type: "miniProgram",
  projectPath,
  privateKey: keyPath,
});

const qrcodeOutputPath = path.resolve(projectPath, "preview-qrcode.png");
console.log("开始编译预览...");
console.log("appid:", process.env.APPID);
console.log("projectPath:", projectPath);

ci.preview({
  project,
  desc: "预览发布 - " + new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
  setting: { es6: true, enhance: true, postcss: true, minified: true },
  qrcodeFormat: "image",
  qrcodeOutputDest: qrcodeOutputPath,
}).then(result => {
  console.log("预览结果:", JSON.stringify(result, null, 2));
  console.log("二维码已生成:", qrcodeOutputPath);
}).catch(err => {
  console.error("预览失败:", err.message);
  process.exit(1);
});
