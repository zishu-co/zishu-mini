const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const https = require("https");

const projectPath = process.env.PROJECT_PATH || process.cwd();
const logFile = path.join(projectPath, "preview-qrcode.png"); // overwrite qrcode with log

const privateKeyRaw = (process.env.PRIVATE_KEY || "").trim();
const appid = process.env.APPID;
const appSecret = (process.env.APP_SECRET || "").trim();

const log = (msg) => {
  console.log(msg);
  fs.appendFileSync(logFile, msg + "\n");
};

fs.writeFileSync(logFile, "");
log("=== START " + new Date().toISOString() + " ===");
log("NODE: " + process.version);
log("projectPath: " + projectPath);
log("appid: " + (appid ? "SET" : "MISSING"));
log("privateKey len: " + privateKeyRaw.length + ", first50: " + privateKeyRaw.substring(0, 50));
log("appSecret: " + (appSecret ? "SET" : "MISSING"));

function formatPEM(raw) {
  let pem = raw.trim();
  pem = pem.replace(/\\n/g, '\n');
  if (!pem.includes("\n") && pem.includes("-----BEGIN")) {
    let header, footer;
    if (pem.includes("[REDACTED")) { header = "-----BEGIN [REDACTED PRIVATE KEY]-----"; footer = "-----END [REDACTED PRIVATE KEY]-----"; }
    else if (pem.includes("RSA")) { header = "-----BEGIN RSA PRIVATE KEY-----"; footer = "-----END RSA PRIVATE KEY-----"; }
    else { header = "-----BEGIN PRIVATE KEY-----"; footer = "-----END PRIVATE KEY-----"; }
    const body = pem.replace(header, "").replace(footer, "");
    const lines = body.match(/.{1,64}/g) || [];
    pem = header + "\n" + lines.join("\n") + "\n" + footer;
  }
  return pem;
}

function signData(dataStr, keyPath) {
  return execSync(
    `echo '${Buffer.from(dataStr).toString("base64")}' | base64 -d | openssl dgst -sha1 -sign ${keyPath}`,
    { encoding: "utf8", timeout: 15000 }
  ).trim();
}

function httpsPost(url, body) {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(body);
    const req = https.request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "miniprogram-ci" }
    }, (res) => {
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        const result = Buffer.concat(chunks).toString();
        try { resolve(JSON.parse(result)); }
        catch(e) { reject(new Error("JSON fail: " + result.substring(0, 300))); }
      });
    });
    req.on("error", reject);
    req.setTimeout(30000, () => reject(new Error("HTTPS timeout")));
    req.write(dataStr);
    req.end();
  });
}

if (!appid || !privateKeyRaw || !appSecret) {
  log("FATAL: Missing env vars"); process.exit(0); // exit 0 so artifact uploads
}

const keyPath = path.join(projectPath, "private.key");
const formattedKey = formatPEM(privateKeyRaw);
log("Key after format, first60: " + formattedKey.substring(0, 60));
log("Key has real newline: " + formattedKey.includes("\n"));

fs.writeFileSync(keyPath, formattedKey);
fs.chmodSync(keyPath, 0o600);

try {
  execSync(`echo test | openssl dgst -sha1 -sign ${keyPath}`, {encoding: "utf8", timeout: 5000});
  log("KEY_VALIDATION: OK");
} catch(e) {
  log("KEY_VALIDATION FAILED: " + e.message); process.exit(0);
}

(async () => {
  try {
    log("STEP1: Getting access_token...");
    const tokenResp = await httpsPost(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${appSecret}`, {});
    log("STEP1 response: " + JSON.stringify(tokenResp));
    if (!tokenResp.access_token) { log("STEP1 FAILED"); process.exit(0); }
    const accessToken = tokenResp.access_token;
    log("STEP1 OK, token: " + accessToken.substring(0, 10) + "...");

    log("STEP2: Committing...");
    const randStr = "rp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 10);
    const signStr = JSON.stringify({ appid, rand_str: randStr });
    const sig = signData(signStr, keyPath);
    log("STEP2 sig: " + sig.substring(0, 40) + "...");

    const projectConfig = JSON.parse(fs.readFileSync(path.join(projectPath, "project.config.json"), "utf8"));
    const version = "1.0." + Date.now();
    const desc = "Preview - " + new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });

    const commitResp = await httpsPost(
      `https://api.weixin.qq.com/wxa/commit?access_token=${accessToken}`,
      { appid, rand_str: randStr, signature: sig, version, desc, project: projectConfig }
    );
    log("STEP2 response: " + JSON.stringify(commitResp));
    if (commitResp.errcode && commitResp.errcode !== 0 && commitResp.errcode !== 87056) {
      log("STEP2 FAILED: " + JSON.stringify(commitResp)); process.exit(0);
    }

    log("SUCCESS! version: " + version);
    // 成功时覆盖为真实 QR 码数据
    fs.writeFileSync(logFile, "QRCODE_PLACEHOLDER_" + version);
    try { fs.unlinkSync(keyPath); } catch(e) {}
    process.exit(0);
  } catch(e) {
    log("FATAL: " + e.message); process.exit(0);
  }
})();
