const fs = require("fs");
const path = require("path");

const projectPath = process.env.PROJECT_PATH || process.cwd();
const qrcodeFile = path.join(projectPath, "preview-qrcode.png");
const privateKeyPath = path.join(projectPath, "private.key");
const logFile = path.join(projectPath, "preview.log");

// 捕获所有未处理错误
process.on('uncaughtException', (err) => {
  const msg = "UNCAUGHT: " + err.message + "\n" + err.stack.split("\n").slice(0,3).join("\n");
  fs.appendFileSync(logFile, msg);
  console.error(msg);
  process.exit(0); // 强制成功，上传日志
});

process.on('unhandledRejection', (reason) => {
  const msg = "UNHANDLED_REJ: " + String(reason);
  fs.appendFileSync(logFile, msg);
  console.error(msg);
  process.exit(0);
});

const log = (msg) => {
  console.log("[preview] " + msg);
  fs.appendFileSync(logFile, msg + "\n");
};

fs.writeFileSync(logFile, "");
fs.writeFileSync(qrcodeFile, Buffer.alloc(0));

log("START " + new Date().toISOString());
log("Node: " + process.version);

const appid = process.env.APPID;
const privateKeyRaw = (process.env.PRIVATE_KEY || "").trim();
const appSecret = process.env.APP_SECRET;

log("APPID: " + (appid ? "SET" : "MISSING"));
log("PRIVATE_KEY: " + (privateKeyRaw ? "SET " + privateKeyRaw.length : "MISSING"));
log("APP_SECRET: " + (appSecret ? "SET" : "MISSING"));

if (!appid || !privateKeyRaw || !appSecret) {
  log("FATAL: Missing env");
  process.exit(0);
}

// 格式化密钥
let pem = privateKeyRaw.replace(/\\n/g, "\n").trim();
if (!pem.includes("\n") && pem.includes("-----BEGIN")) {
  const isRSA = pem.includes("RSA");
  const h = isRSA ? "-----BEGIN RSA PRIVATE KEY-----" : "-----BEGIN PRIVATE KEY-----";
  const f = isRSA ? "-----END RSA PRIVATE KEY-----" : "-----END PRIVATE KEY-----";
  const body = pem.replace(h, "").replace(f, "");
  pem = h + "\n" + (body.match(/.{1,64}/g) || []).join("\n") + "\n" + f;
}

fs.writeFileSync(privateKeyPath, pem);
fs.chmodSync(privateKeyPath, 0o600);
log("Key written");

// 简单初始化
try {
  const M = require("miniprogram-ci");
  log("miniprogram-ci loaded, version: " + (M.version || "?"));
} catch(e) {
  log("require FAIL: " + e.message);
  process.exit(0);
}

const ci = new (require("miniprogram-ci").WxMiniprogramCI)({
  appid,
  privateKey: pem,
  privateKeyPath,
});

log("CI instance created");

const version = "1.0." + Date.now();
const projectConfig = JSON.parse(fs.readFileSync(path.join(projectPath, "project.config.json"), "utf8"));

log("Calling preview()...");
ci.preview({
  projectConfig,
  packageOptions: { ignoreExtFiles: false },
  onProgressUpdate: (p) => log("PROGRESS: " + JSON.stringify(p)),
}).then((res) => {
  log("SUCCESS!");
  log("qrCodeUrl: " + (res.qrCodeUrl || "NONE"));
  log("qrcodeData: " + (res.qrcodeData ? "SET len=" + res.qrcodeData.length : "NONE"));
  if (res.qrcodeData) {
    fs.writeFileSync(qrcodeFile, Buffer.from(res.qrcodeData, "base64"));
    log("QR written: " + fs.statSync(qrcodeFile).size);
  } else if (res.qrCodeUrl) {
    fs.writeFileSync(qrcodeFile, Buffer.from("URL:" + res.qrCodeUrl));
  }
  try { fs.unlinkSync(privateKeyPath); } catch(e) {}
  process.exit(0);
}).catch((err) => {
  log("CATCH err: " + err.message);
  if (err.code) log("code: " + err.code);
  if (err.response) log("response: " + JSON.stringify(err.response).substring(0, 200));
  process.exit(0);
});

log("preview() called, waiting...");
