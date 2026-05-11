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
  const h = isRSA ? "-----BEGIN RSA PRIVATE KEY-----" : "-----BEGIN PRIVATE KEY-----";
  const f = isRSA ? "-----END RSA PRIVATE KEY-----" : "-----END PRIVATE KEY-----";
  const body = pem.replace(h, "").replace(f, "");
  pem = h + "\n" + (body.match(/.{1,64}/g) || []).join("\n") + "\n" + f;
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
    
    log("Step 2: Trying miniprogram-ci preview...");
    let M;
    try { M = require("miniprogram-ci"); }
    catch(err) {
      log("require miniprogram-ci FAILED: " + err.message);
      return null;
    }
    
    const ci = new M.WxMiniprogramCI({
      appid: appid,
      privateKey: pem,
      privateKeyPath: privateKeyPath,
      ignores: [],
    });
    
    const projectConfig = JSON.parse(fs.readFileSync(path.join(projectPath, "project.config.json"), "utf8"));
    
    return ci.preview({
      projectConfig: projectConfig,
      packageOptions: { ignoreExtFiles: false },
      onProgressUpdate: function(p) { log("PROGRESS: " + JSON.stringify(p)); },
    }).then(function(resp) {
      log("miniprogram-ci preview SUCCESS");
      log("Response keys: " + Object.keys(resp).join(","));
      log("qrcodeData: " + (resp.qrcodeData ? "SET(len=" + resp.qrcodeData.length + ")" : "NONE"));
      log("qrCodeUrl: " + (resp.qrCodeUrl || "NONE"));
      
      fs.writeFileSync(responseFile, JSON.stringify(resp, null, 2));
      
      if (resp.qrcodeData) {
        fs.writeFileSync(qrcodeFile, Buffer.from(resp.qrcodeData, "base64"));
        exitOk();
        return true;
      } else if (resp.qrCodeUrl) {
        const fullUrl = resp.qrCodeUrl.startsWith("http") ? resp.qrCodeUrl : "https://open.weixin.qq.com" + resp.qrCodeUrl;
        fs.writeFileSync(path.join(projectPath, "preview-url.txt"), Buffer.from(fullUrl));
        log("No qrcodeData, using qrCodeUrl: " + fullUrl);
        // 尝试用 qrCodeUrl 下载图片
        return httpGet(fullUrl, 10000).then(function(imgData) {
          if (Buffer.isBuffer(imgData) || (typeof imgData === 'string' && imgData.length > 100)) {
            const buf = Buffer.isBuffer(imgData) ? imgData : Buffer.from(imgData);
            if (buf.length > 100) {
              fs.writeFileSync(qrcodeFile, buf);
              log("Downloaded QR image: " + buf.length + " bytes");
              exitOk();
              return true;
            }
          }
          log("Could not download QR image from URL");
          return false;
        }).catch(function() {
          log("URL download failed");
          return false;
        });
      }
      return false;
    }).catch(function(err) {
      log("miniprogram-ci preview FAILED: " + err.message);
      fs.writeFileSync(responseFile, Buffer.from("MINIPROGRAM_CI_ERROR:" + err.message));
      return false;
    });
  })
  .then(function(hasQR) {
    if (hasQR === true) return; // already exited with QR
    if (hasQR === false) {
      log("miniprogram-ci did not produce QR, trying WeChat API...");
    }
    
    // 获取 access_token 重试
    return httpGet("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=" + appid + "&secret=" + appSecret)
      .then(function(tokenResp2) {
        if (!tokenResp2.access_token) throw new Error("No access_token in retry");
        return tokenResp2.access_token;
      });
  })
  .then(function(accessToken) {
    if (!accessToken) return;
    
    log("Step 3: Trying WeChat generateQrcode API...");
    // 尝试用微信官方的 generateQrcode API
    return httpPost("https://api.weixin.qq.com/wxa/get_qrcode?access_token=" + accessToken, {
      path: "pages/index/index",
      width: 430,
      env_version: "trial"  // trial=体验版, release=正式版
    }).then(function(qrResp) {
      log("generateQrcode response keys: " + Object.keys(qrResp).join(","));
      fs.writeFileSync(responseFile, JSON.stringify(qrResp, null, 2));
      
      if (qrResp.buffer) {
        // 返回的是 base64 编码的图片
        fs.writeFileSync(qrcodeFile, Buffer.from(qrResp.buffer, "base64"));
        log("QR from generateQrcode buffer: " + qrResp.buffer.length + " chars");
        exitOk();
      } else if (qrResp.show_qrcode) {
        // 返回的是 URL
        const qrUrl = qrResp.show_qrcode;
        log("show_qrcode URL: " + qrUrl);
        fs.writeFileSync(path.join(projectPath, "preview-url.txt"), Buffer.from(qrUrl));
        // 尝试下载
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
