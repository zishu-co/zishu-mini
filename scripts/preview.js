const ci = require("miniprogram-ci");
const fs = require("fs");
const path = require("path");
const https = require("https");
const { URL } = require("url");

const projectPath = process.env.PROJECT_PATH || process.cwd();
const qrcodeFile = path.join(projectPath, "preview-qrcode.png");
const privateKeyPath = path.join(projectPath, "private.key");
const logFile = path.join(projectPath, "preview.log");
const responseFile = path.join(projectPath, "api-response.json");

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
  const header = isRSA ? "-----BEGIN RSA PRIVATE KEY-----" : "-----BEGIN PRIVATE KEY-----";
  const footer = isRSA ? "-----END RSA PRIVATE KEY-----" : "-----END PRIVATE KEY-----";
  const body = pem.replace(header, "").replace(footer, "");
  pem = header + "\n" + (body.match(/.{1,64}/g) || []).join("\n") + "\n" + footer;
}

fs.writeFileSync(privateKeyPath, pem);
fs.chmodSync(privateKeyPath, 0o600);
log("Key written");

function httpGet(url, timeoutMs) {
  timeoutMs = timeoutMs || 15000;
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
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch(e) { resolve(Buffer.concat(chunks).toString()); }
      });
    });
    req.on("error", reject);
    req.setTimeout(timeoutMs, function() { req.destroy(); reject(new Error("HTTP GET timeout")); });
  });
}

function httpPost(url, body, timeoutMs) {
  timeoutMs = timeoutMs || 15000;
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
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch(e) { resolve(Buffer.concat(chunks).toString()); }
      });
    });
    req.on("error", reject);
    req.write(data); req.end();
    req.setTimeout(timeoutMs, function() { req.destroy(); reject(new Error("HTTP POST timeout")); });
  });
}

function exitOk(data) {
  log("EXIT OK");
  try { fs.unlinkSync(privateKeyPath); } catch(e) {}
  process.exit(0);
}

// 使用新版 miniprogram-ci API
async function runPreview() {
  log("Creating project with new API...");
  
  const project = new ci.Project({
    appid: appid,
    type: "miniProgram",
    projectPath: projectPath,
    privateKeyPath: privateKeyPath,
    ignores: [],
  });

  log("Calling preview()...");
  const result = await ci.preview({
    project: project,
    desc: "预览发布 - " + new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
    setting: { es6: true, enhance: true, postcss: true, minified: true },
    qrcodeFormat: "image",
    qrcodeOutputDest: qrcodeFile,
    onProgressUpdate: function(p) { log("PROGRESS: " + JSON.stringify(p)); },
  });

  log("Preview result keys: " + Object.keys(result).join(","));
  log("qrcodeData: " + (result.qrcodeData ? "SET(len=" + result.qrcodeData.length + ")" : "NONE"));
  log("qrCodeUrl: " + (result.qrCodeUrl || "NONE"));

  fs.writeFileSync(responseFile, JSON.stringify(result, null, 2));

  if (result.qrcodeData) {
    fs.writeFileSync(qrcodeFile, Buffer.from(result.qrcodeData, "base64"));
    log("QR written from qrcodeData: " + result.qrcodeData.length + " chars");
    exitOk();
    return true;
  } else if (result.qrCodeUrl) {
    const fullUrl = result.qrCodeUrl.startsWith("http") ? result.qrCodeUrl : "https://open.weixin.qq.com" + result.qrCodeUrl;
    fs.writeFileSync(path.join(projectPath, "preview-url.txt"), Buffer.from(fullUrl));
    log("No qrcodeData, using qrCodeUrl: " + fullUrl);
    try {
      const imgData = await httpGet(fullUrl, 10000);
      if (Buffer.isBuffer(imgData) || (typeof imgData === 'string' && imgData.length > 100)) {
        const buf = Buffer.isBuffer(imgData) ? imgData : Buffer.from(imgData);
        if (buf.length > 100) {
          fs.writeFileSync(qrcodeFile, buf);
          log("Downloaded QR image: " + buf.length + " bytes");
          exitOk();
          return true;
        }
      }
    } catch(e) {
      log("URL download failed: " + e.message);
    }
  }
  return false;
}

// Step 1: 获取 access_token
log("Step 1: Getting access_token...");
httpGet("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=" + appid + "&secret=" + appSecret)
  .then(function(tokenResp) {
    log("access_token response: " + JSON.stringify(tokenResp));
    if (!tokenResp.access_token) {
      fs.writeFileSync(responseFile, JSON.stringify(tokenResp));
      fs.writeFileSync(qrcodeFile, Buffer.from("TOKEN_ERROR:" + (tokenResp.errmsg || JSON.stringify(tokenResp))));
      exitOk();
      return null;
    }
    return tokenResp.access_token;
  })
  .then(function(accessToken) {
    if (!accessToken) return;
    return runPreview();
  })
  .then(function(hasQR) {
    if (hasQR === true) return;
    if (hasQR === false) {
      log("miniprogram-ci did not produce QR, trying WeChat API...");
    }
    return httpGet("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=" + appid + "&secret=" + appSecret)
      .then(function(tokenResp2) {
        if (!tokenResp2.access_token) throw new Error("No access_token in retry");
        return tokenResp2.access_token;
      });
  })
  .then(function(accessToken) {
    if (!accessToken) return;
    log("Step 3: Trying WeChat generateQrcode API...");
    return httpPost("https://api.weixin.qq.com/wxa/get_qrcode?access_token=" + accessToken, {
      path: "pages/index/index",
      width: 430,
      env_version: "trial"
    }).then(function(qrResp) {
      log("generateQrcode response keys: " + Object.keys(qrResp).join(","));
      fs.writeFileSync(responseFile, JSON.stringify(qrResp, null, 2));

      if (qrResp.buffer) {
        fs.writeFileSync(qrcodeFile, Buffer.from(qrResp.buffer, "base64"));
        log("QR from generateQrcode buffer: " + qrResp.buffer.length + " chars");
        exitOk();
      } else if (qrResp.show_qrcode) {
        const qrUrl = qrResp.show_qrcode;
        log("show_qrcode URL: " + qrUrl);
        fs.writeFileSync(path.join(projectPath, "preview-url.txt"), Buffer.from(qrUrl));
        return httpGet(qrUrl, 10000).then(function(imgData) {
          if (Buffer.isBuffer(imgData) && imgData.length > 100) {
            fs.writeFileSync(qrcodeFile, imgData);
            exitOk();
          } else {
            log("Could not download from show_qrcode URL");
            fs.writeFileSync(qrcodeFile, Buffer.from("QR_URL:" + qrUrl));
            exitOk();
          }
        }).catch(function() {
          log("Failed to download from show_qrcode URL");
          fs.writeFileSync(qrcodeFile, Buffer.from("QR_URL:" + qrUrl));
          exitOk();
        });
      } else if (qrResp.errcode) {
        log("generateQrcode error: " + qrResp.errcode + " - " + (qrResp.errmsg || ""));
        fs.writeFileSync(qrcodeFile, Buffer.from("WX_API_ERROR:" + qrResp.errcode + ":" + (qrResp.errmsg || "")));
        exitOk();
      } else {
        log("Unknown generateQrcode response: " + JSON.stringify(qrResp).substring(0, 200));
        fs.writeFileSync(qrcodeFile, Buffer.from("UNKNOWN_RESPONSE:" + JSON.stringify(qrResp).substring(0, 200)));
        exitOk();
      }
    });
  })
  .catch(function(err) {
    log("CATCH: " + err.message);
    fs.writeFileSync(qrcodeFile, Buffer.from("ERROR:" + err.message));
    exitOk();
  });
