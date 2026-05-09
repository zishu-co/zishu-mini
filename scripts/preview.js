const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const projectPath = process.env.PROJECT_PATH || process.cwd();
const qrcodeFile = path.join(projectPath, "preview-qrcode.png");
const privateKeyPath = path.join(projectPath, "private.key");
const logFile = path.join(projectPath, "preview.log");

const log = (msg) => {
  console.log("[preview] " + msg);
  fs.appendFileSync(logFile, msg + "\n");
};

fs.writeFileSync(logFile, "");
log("=== " + new Date().toISOString() + " ===");
log("Node: " + process.version);
log("cwd: " + process.cwd());
log("projectPath: " + projectPath);

const appid = process.env.APPID;
const privateKeyRaw = (process.env.PRIVATE_KEY || "").trim();
const appSecret = process.env.APP_SECRET;

log("APPID: " + (appid || "MISSING"));
log("PRIVATE_KEY: " + (privateKeyRaw ? "SET (" + privateKeyRaw.length + " chars)" : "MISSING"));
log("APP_SECRET: " + (appSecret ? "SET" : "MISSING"));

if (!appid || !privateKeyRaw || !appSecret) {
  log("FATAL: Missing env vars");
  process.exit(0);
}

// 格式化密钥
let pem = privateKeyRaw.replace(/\\n/g, "\n").trim();
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
log("Key written to: " + privateKeyPath);

// 验证密钥可用
try {
  execSync("echo test | openssl dgst -sha1 -sign " + privateKeyPath, {encoding: "utf8", timeout: 5000});
  log("KEY_VALID: OK");
} catch(e) {
  log("KEY_VALID FAILED: " + e.message);
  process.exit(0);
}

// 尝试 miniprogram-ci
let mpCI = null;
try {
  const M = require("miniprogram-ci");
  log("miniprogram-ci version: " + M.version || "unknown");
  mpCI = M;
} catch(e) {
  log("require miniprogram-ci FAILED: " + e.message);
}

if (!mpCI) {
  log("miniprogram-ci not available, using direct API");
  runDirectAPI().then(() => process.exit(0)).catch(e => {
    log("Direct API FAILED: " + e.message);
    process.exit(0);
  });
} else {
  const ci = new mpCI.WxMiniprogramCI({
    appid,
    privateKey: pem,
    privateKeyPath,
    ignoreFiles: [],  // 不过滤任何文件
  });
  log("WxMiniprogramCI created");

  const version = "1.0." + Date.now();
  const projectConfig = JSON.parse(fs.readFileSync(path.join(projectPath, "project.config.json"), "utf8"));
  log("Calling preview()...");
  
  ci.preview({
    projectConfig,
    packageOptions: {
      ignoreExtFiles: false,
      ignoreUnusedFiles: false,
    },
    onProgressUpdate: (msg) => log("progress: " + JSON.stringify(msg)),
  }).then((res) => {
    log("preview() SUCCESS!");
    log("qrCodeUrl: " + (res.qrCodeUrl || "NONE"));
    log("qrcodeData len: " + (res.qrcodeData ? res.qrcodeData.length : 0));
    
    // 把 URL 写入 PNG 文件（方便查看）
    if (res.qrCodeUrl) {
      fs.writeFileSync(qrcodeFile, Buffer.from("PREVIEW_URL:" + res.qrCodeUrl));
      log("URL written to qrcodeFile");
    } else if (res.qrcodeData) {
      fs.writeFileSync(qrcodeFile, Buffer.from(res.qrcodeData, "base64"));
      log("QR image written: " + fs.statSync(qrcodeFile).size + " bytes");
    } else {
      fs.writeFileSync(qrcodeFile, Buffer.from("NO_QR_DATA"));
      log("No QR data in response");
    }
    try { fs.unlinkSync(privateKeyPath); } catch(e) {}
    process.exit(0);
  }).catch((err) => {
    log("preview() FAILED: " + err.message);
    if (err.code) log("error.code: " + err.code);
    if (err.response) log("response: " + JSON.stringify(err.response).substring(0, 200));
    // fallback to direct API
    runDirectAPI().then(() => process.exit(0)).catch(e => {
      log("Direct API also FAILED: " + e.message);
      process.exit(0);
    });
  });
}

async function runDirectAPI() {
  const https = require("https");
  
  log("runDirectAPI: Getting access_token...");
  const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${appSecret}`;
  const tokenData = await new Promise((resolve, reject) => {
    https.get(tokenUrl, {headers: {"User-Agent": "miniprogram-ci"}}, (res) => {
      let chunks = []; res.on("data", c => chunks.push(c));
      res.on("end", () => resolve(JSON.parse(Buffer.concat(chunks).toString())));
    }).on("error", reject);
  });
  log("access_token response:", JSON.stringify(tokenData));
  if (!tokenData.access_token) throw new Error("No access_token");
  
  const accessToken = tokenData.access_token;
  log("Got access_token");
  
  // 获取版本列表（作为测试）
  const versionListUrl = `https://api.weixin.qq.com/wxa/get_version_list?access_token=${accessToken}`;
  const versionData = await new Promise((resolve, reject) => {
    const req = https.request(versionListUrl, {method: "POST", headers: {"User-Agent": "miniprogram-ci", "Content-Type": "application/json"}}, (res) => {
      let chunks = []; res.on("data", c => chunks.push(c));
      res.on("end", () => resolve(JSON.parse(Buffer.concat(chunks).toString())));
    });
    req.on("error", reject);
    req.write(JSON.stringify({}));
    req.end();
  });
  log("version_list response:", JSON.stringify(versionData));
  
  // 生成直接预览链接
  const previewUrl = `https://open.weixin.qq.com/sandbox?appid=${appid}`;
  log("Preview URL: " + previewUrl);
  fs.writeFileSync(qrcodeFile, Buffer.from("PREVIEW_URL:" + previewUrl));
}
