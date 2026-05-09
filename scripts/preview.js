const fs = require("fs");
const path = require("path");
const https = require("https");
const { URL } = require("url");

const projectPath = process.env.PROJECT_PATH || process.cwd();
const qrcodeFile = path.join(projectPath, "preview-qrcode.png");
const privateKeyPath = path.join(projectPath, "private.key");
const logFile = path.join(projectPath, "preview.log");
const responseFile = path.join(projectPath, "api-response.json");

process.on('uncaughtException', (err) => {
  fs.appendFileSync(logFile, "UNCAUGHT: " + err.message + "\n" + err.stack + "\n");
  console.error("UNCAUGHT:", err.message);
  process.exit(0);
});
process.on('unhandledRejection', (reason) => {
  const msg = "UNHANDLED: " + String(reason);
  fs.appendFileSync(logFile, msg + "\n");
  console.error(msg);
  process.exit(0);
});

const log = (msg) => {
  console.log("[preview] " + msg);
  fs.appendFileSync(logFile, msg + "\n");
};

fs.writeFileSync(logFile, "");
fs.writeFileSync(qrcodeFile, Buffer.alloc(0));
log("=== START " + new Date().toISOString() + " ===");
log("Node: " + process.version);

const appid = process.env.APPID;
const privateKeyRaw = (process.env.PRIVATE_KEY || "").trim();
const appSecret = process.env.APP_SECRET;

log("APPID: " + (appid || "MISSING"));
log("PRIVATE_KEY: " + (privateKeyRaw ? "SET(" + privateKeyRaw.length + ")" : "MISSING"));
log("APP_SECRET: " + (appSecret ? "SET" : "MISSING"));

if (!appid || !privateKeyRaw || !appSecret) {
  log("FATAL: Missing env vars");
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
log("Key written to " + privateKeyPath);

// HTTP 工具
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    const req = https.get({ hostname: opts.hostname, path: opts.pathname + opts.search, headers: { "User-Agent": "miniprogram-ci/1.0" } }, (res) => {
      const chunks = []; res.on("data", c => chunks.push(c)); res.on("end", () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch(e) { resolve(Buffer.concat(chunks).toString()); }
      });
    });
    req.on("error", reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error("HTTP GET timeout")); });
  });
}

function httpPost(url, body) {
  const data = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    const req = https.request({ hostname: opts.hostname, path: opts.pathname + opts.search, method: "POST", headers: { "User-Agent": "miniprogram-ci/1.0", "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } }, (res) => {
      const chunks = []; res.on("data", c => chunks.push(c)); res.on("end", () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch(e) { resolve(Buffer.concat(chunks).toString()); }
      });
    });
    req.on("error", reject);
    req.write(data); req.end();
    req.setTimeout(10000, () => { req.destroy(); reject(new Error("HTTP POST timeout")); });
  });
}

// Step 1: 获取 access_token
log("Step 1: Getting access_token...");
const tokenResp = await httpGet(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${appSecret}`);
log("access_token response: " + JSON.stringify(tokenResp));

if (!tokenResp.access_token) {
  log("ERROR: No access_token! errcode=" + tokenResp.errcode + ", errmsg=" + tokenResp.errmsg);
  // 保存错误响应
  fs.writeFileSync(responseFile, JSON.stringify(tokenResp));
  fs.writeFileSync(qrcodeFile, Buffer.from("TOKEN_ERROR:" + (tokenResp.errmsg || JSON.stringify(tokenResp))));
  process.exit(0);
}

const accessToken = tokenResp.access_token;
const apiBase = `https://api.weixin.qq.com/wxa?access_token=${accessToken}`;

// Step 2: 调用 miniprogram-ci preview
log("Step 2: Loading miniprogram-ci...");
let ci;
try {
  const M = require("miniprogram-ci");
  log("miniprogram-ci loaded, version: " + (M.version || "unknown"));
  ci = new M.WxMiniprogramCI({
    appid,
    privateKey: pem,
    privateKeyPath,
    ignores: [],
  });
  log("WxMiniprogramCI instance created");
} catch(err) {
  log("miniprogram-ci init FAILED: " + err.message);
  fs.writeFileSync(responseFile, Buffer.from("INIT_ERROR:" + err.message));
  fs.writeFileSync(qrcodeFile, Buffer.from("INIT_ERROR:" + err.message));
  process.exit(0);
}

const projectConfig = JSON.parse(fs.readFileSync(path.join(projectPath, "project.config.json"), "utf8"));

log("Step 3: Calling ci.preview()...");
let previewResp;
try {
  previewResp = await ci.preview({
    projectConfig,
    packageOptions: { ignoreExtFiles: false },
    onProgressUpdate: (p) => log("PROGRESS: " + JSON.stringify(p)),
  });
  log("ci.preview() returned!");
} catch(err) {
  log("ci.preview() THREW: " + err.message);
  if (err.code) log("  code: " + err.code);
  if (err.response) log("  response: " + JSON.stringify(err.response).substring(0, 200));
  // 尝试 upload 作为替代
  log("Trying ci.upload() as fallback...");
  try {
    previewResp = await ci.upload({
      projectConfig,
      packageOptions: { ignoreExtFiles: false },
      onProgressUpdate: (p) => log("UPLOAD PROGRESS: " + JSON.stringify(p)),
    });
    log("ci.upload() returned!");
  } catch(uploadErr) {
    log("ci.upload() also FAILED: " + uploadErr.message);
    fs.writeFileSync(responseFile, Buffer.from("PREVIEW_ERROR:" + err.message + "\nUPLOAD_ERROR:" + uploadErr.message));
    fs.writeFileSync(qrcodeFile, Buffer.from("API_ERROR"));
    process.exit(0);
  }
}

// 写入完整响应
fs.writeFileSync(responseFile, JSON.stringify(previewResp, null, 2));
log("Response saved. Keys: " + Object.keys(previewResp).join(","));

log("qrCodeUrl: " + (previewResp.qrCodeUrl || "NONE"));
log("qrcodeData: " + (previewResp.qrcodeData ? "SET(len=" + previewResp.qrcodeData.length + ")" : "NONE"));

// 优先用 qrcodeData (PNG base64)
if (previewResp.qrcodeData) {
  const buf = Buffer.from(previewResp.qrcodeData, "base64");
  fs.writeFileSync(qrcodeFile, buf);
  log("QR from qrcodeData: " + buf.length + " bytes -> " + qrcodeFile);
} else if (previewResp.qrCodeUrl) {
  // qrCodeUrl 是一个相对路径，构建完整 URL
  const fullUrl = previewResp.qrCodeUrl.startsWith("http") 
    ? previewResp.qrCodeUrl 
    : `https://open.weixin.qq.com${previewResp.qrCodeUrl}`;
  log("qrCodeUrl full: " + fullUrl);
  // 保存 URL 文本到 qrcodeFile（用于调试）
  fs.writeFileSync(qrcodeFile, Buffer.from("QR_URL:" + fullUrl));
  // 同时写一个文本文件记录完整信息
  fs.writeFileSync(path.join(projectPath, "preview-url.txt"), Buffer.from(fullUrl));
} else {
  log("WARNING: No qrcodeData and no qrCodeUrl!");
  fs.writeFileSync(qrcodeFile, Buffer.from("NO_QR_DATA"));
}

try { fs.unlinkSync(privateKeyPath); } catch(e) {}
log("Done!");
process.exit(0);
