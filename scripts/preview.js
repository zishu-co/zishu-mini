const fs = require("fs");
const path = require("path");
const https = require("https");
const { URL } = require("url");

const projectPath = process.env.PROJECT_PATH || process.cwd();
const qrcodeFile = path.join(projectPath, "preview-qrcode.png");
const privateKeyPath = path.join(projectPath, "private.key");
const logFile = path.join(projectPath, "preview.log");
const responseFile = path.join(projectPath, "api-response.json");

// 全局错误捕获
process.on('uncaughtException', function(err) {
  fs.appendFileSync(logFile, "UNCAUGHT: " + err.message + "\n" + (err.stack||'').split("\n").slice(0,3).join("\n") + "\n");
  console.error("UNCAUGHT:", err.message);
  process.exit(0);
});
process.on('unhandledRejection', function(reason) {
  fs.appendFileSync(logFile, "UNHANDLED: " + String(reason) + "\n");
  console.error("UNHANDLED:", String(reason));
  process.exit(0);
});

function log(msg) {
  console.log("[preview] " + msg);
  fs.appendFileSync(logFile, msg + "\n");
}

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

// HTTP 工具函数
function httpGet(url) {
  return new Promise(function(resolve, reject) {
    const opts = new URL(url);
    const req = https.get({
      hostname: opts.hostname,
      path: opts.pathname + opts.search,
      headers: { "User-Agent": "miniprogram-ci/1.0" }
    }, function(res) {
      const chunks = [];
      res.on("data", function(c) { chunks.push(c); });
      res.on("end", function() {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString()));
        } catch(e) {
          resolve(Buffer.concat(chunks).toString());
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, function() { req.destroy(); reject(new Error("HTTP GET timeout")); });
  });
}

function httpPost(url, body) {
  const data = JSON.stringify(body);
  return new Promise(function(resolve, reject) {
    const opts = new URL(url);
    const req = https.request({
      hostname: opts.hostname,
      path: opts.pathname + opts.search,
      method: "POST",
      headers: { "User-Agent": "miniprogram-ci/1.0", "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }
    }, function(res) {
      const chunks = [];
      res.on("data", function(c) { chunks.push(c); });
      res.on("end", function() {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString()));
        } catch(e) {
          resolve(Buffer.concat(chunks).toString());
        }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
    req.setTimeout(15000, function() { req.destroy(); reject(new Error("HTTP POST timeout")); });
  });
}

function exitOk() {
  try { fs.unlinkSync(privateKeyPath); } catch(e) {}
  log("EXIT OK");
  process.exit(0);
}

function exitFail(msg) {
  log("EXIT FAIL: " + msg);
  try { fs.unlinkSync(privateKeyPath); } catch(e) {}
  process.exit(0);
}

// 主流程
log("Step 1: Getting access_token...");
httpGet("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=" + appid + "&secret=" + appSecret)
  .then(function(tokenResp) {
    log("token response: " + JSON.stringify(tokenResp));
    if (!tokenResp.access_token) {
      fs.writeFileSync(responseFile, JSON.stringify(tokenResp));
      fs.writeFileSync(qrcodeFile, Buffer.from("TOKEN_ERROR:" + (tokenResp.errmsg || JSON.stringify(tokenResp))));
      exitFail("No access_token");
      return null;
    }
    return tokenResp.access_token;
  })
  .then(function(accessToken) {
    if (!accessToken) return;
    log("Step 2: Loading miniprogram-ci...");
    let M;
    try { M = require("miniprogram-ci"); }
    catch(err) {
      log("require miniprogram-ci FAILED: " + err.message);
      fs.writeFileSync(responseFile, Buffer.from("REQUIRE_ERROR:" + err.message));
      fs.writeFileSync(qrcodeFile, Buffer.from("REQUIRE_ERROR"));
      exitFail("require miniprogram-ci failed");
      return;
    }
    log("miniprogram-ci loaded, version: " + (M.version || "unknown"));
    
    const ci = new M.WxMiniprogramCI({
      appid: appid,
      privateKey: pem,
      privateKeyPath: privateKeyPath,
      ignores: [],
    });
    log("WxMiniprogramCI instance created");
    
    const projectConfig = JSON.parse(fs.readFileSync(path.join(projectPath, "project.config.json"), "utf8"));
    
    log("Step 3: Calling ci.preview()...");
    return ci.preview({
      projectConfig: projectConfig,
      packageOptions: { ignoreExtFiles: false },
      onProgressUpdate: function(p) { log("PROGRESS: " + JSON.stringify(p)); },
    });
  })
  .then(function(previewResp) {
    if (!previewResp) return;
    
    log("ci.preview() SUCCESS!");
    log("Response keys: " + Object.keys(previewResp).join(","));
    
    fs.writeFileSync(responseFile, JSON.stringify(previewResp, null, 2));
    
    const qrCodeUrl = previewResp.qrCodeUrl;
    const qrcodeData = previewResp.qrcodeData;
    
    log("qrCodeUrl: " + (qrCodeUrl || "NONE"));
    log("qrcodeData: " + (qrcodeData ? "SET(len=" + qrcodeData.length + ")" : "NONE"));
    
    if (qrcodeData) {
      const buf = Buffer.from(qrcodeData, "base64");
      fs.writeFileSync(qrcodeFile, buf);
      log("QR from qrcodeData: " + buf.length + " bytes");
      exitOk();
    } else if (qrCodeUrl) {
      const fullUrl = qrCodeUrl.startsWith("http") ? qrCodeUrl : "https://open.weixin.qq.com" + qrCodeUrl;
      log("qrCodeUrl full: " + fullUrl);
      fs.writeFileSync(path.join(projectPath, "preview-url.txt"), Buffer.from(fullUrl));
      fs.writeFileSync(qrcodeFile, Buffer.from("QR_URL:" + fullUrl));
      exitOk();
    } else {
      log("WARNING: No qrcodeData and no qrCodeUrl!");
      log("Full response: " + JSON.stringify(previewResp).substring(0, 300));
      fs.writeFileSync(qrcodeFile, Buffer.from("NO_QR_DATA:" + JSON.stringify(previewResp).substring(0, 200)));
      exitOk();
    }
  })
  .catch(function(err) {
    log("CATCH error: " + err.message);
    if (err.code) log("  code: " + err.code);
    if (err.response) log("  response: " + JSON.stringify(err.response).substring(0, 200));
    if (err.stack) log("  stack: " + err.stack.split("\n").slice(0,3).join(" | "));
    
    // 保存错误响应
    fs.writeFileSync(responseFile, Buffer.from("ERROR:" + err.message + "\ncode:" + String(err.code) + "\nresponse:" + JSON.stringify(err.response || {}).substring(0,200)));
    fs.writeFileSync(qrcodeFile, Buffer.from("API_ERROR:" + err.message));
    exitFail("preview API failed");
  });
