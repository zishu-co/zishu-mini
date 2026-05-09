const fs = require("fs");
const path = require("path");

const projectPath = process.env.PROJECT_PATH || process.cwd();
const privateKeyPath = path.join(projectPath, "private.key");

// 日志文件
const logFile = path.join(projectPath, "preview-qrcode.png"); // 用 png 后缀，upload-artifact 会识别
fs.writeFileSync(logFile, "INIT...");

const log = (msg) => {
  console.log(msg);
  fs.appendFileSync(logFile, msg + "\n");
};

log("=== " + new Date().toISOString() + " ===");
log("NODE: " + process.version);

const { WxMiniprogramCI } = (() => {
  try { return require("miniprogram-ci"); } catch(e) { return {}; }
})();

const appid = process.env.APPID;
const privateKey = (process.env.PRIVATE_KEY || "").trim();
const appSecret = process.env.APP_SECRET;

log("appid: " + (appid ? "SET" : "MISSING"));
log("privateKey: " + (privateKey ? "SET len=" + privateKey.length : "MISSING"));
log("appSecret: " + (appSecret ? "SET" : "MISSING"));

if (!appid || !privateKey || !appSecret) {
  log("FATAL: Missing env vars");
  process.exit(1);
}

// 格式化密钥（处理 GitHub Secrets 字面 \n）
let pem = privateKey.trim().replace(/\\n/g, "\n");
if (!pem.includes("\n") && pem.includes("-----BEGIN")) {
  const isRSA = pem.includes("RSA");
  const header = isRSA ? "-----BEGIN RSA PRIVATE KEY-----" : "-----BEGIN PRIVATE KEY-----";
  const footer = isRSA ? "-----END RSA PRIVATE KEY-----" : "-----END PRIVATE KEY-----";
  const body = pem.replace(header, "").replace(footer, "");
  const lines = (body.match(/.{1,64}/g) || []);
  pem = header + "\n" + lines.join("\n") + "\n" + footer;
}

fs.writeFileSync(privateKeyPath, pem);
fs.chmodSync(privateKeyPath, 0o600);

const ci = new WxMiniprogramCI({
  appid,
  privateKey: pem,
  privateKeyPath,
  ignores: ["node_modules/**"],
});

const version = "1.0." + Date.now();
const desc = "Preview " + new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });

log("Uploading for preview...");
log("version: " + version);

ci.preview({
  projectConfig: JSON.parse(fs.readFileSync(path.join(projectPath, "project.config.json"), "utf8")),
  packageOptions: {
    ignoreExtFiles: false,
  },
  onProgressUpdate: (msg) => {
    log("[progress] " + JSON.stringify(msg));
  },
}).then((res) => {
  log("SUCCESS!");
  log("qrCodeUrl: " + (res.qrCodeUrl || "NONE"));
  log("qrcodeData: " + (res.qrcodeData ? "SET" : "NONE"));
  
  if (res.qrcodeData) {
    // qrcodeData 是 base64 编码的图片
    const imgBuffer = Buffer.from(res.qrcodeData, "base64");
    fs.writeFileSync(logFile, imgBuffer);
    log("Written QR code image: " + imgBuffer.length + " bytes");
  } else if (res.qrCodeUrl) {
    // 如果只有 URL，写入 URL 文本
    fs.writeFileSync(logFile, "QR_URL:" + res.qrCodeUrl);
  }
  
  try { fs.unlinkSync(privateKeyPath); } catch(e) {}
  process.exit(0);
}).catch((err) => {
  log("ERROR: " + err.message);
  if (err.stack) log(err.stack.split("\n").slice(0, 3).join("\n"));
  process.exit(1);
});
