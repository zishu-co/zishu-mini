const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const https = require("https");

const projectPath = process.env.PROJECT_PATH || process.cwd();
const privateKeyRaw = (process.env.PRIVATE_KEY || "").trim();
const appid = process.env.APPID;
const appSecret = (process.env.APP_SECRET || "").trim();

console.log("=== PREVIEW DEBUG ===");
console.log("NODE_VERSION:", process.version);
console.log("projectPath:", projectPath);
console.log("appid:", appid || "MISSING");
console.log("privateKey len:", privateKeyRaw.length, "first50:", privateKeyRaw.substring(0, 50));
console.log("privateKey has literal backslash-n:", privateKeyRaw.includes("\\n"));
console.log("appSecret:", appSecret ? "SET" : "MISSING");

function formatPEM(raw) {
  let pem = raw.trim();
  pem = pem.replace(/\\n/g, '\n');
  if (!pem.includes("\n") && pem.includes("-----BEGIN")) {
    let header, footer;
    if (pem.includes("[REDACTED PRIVATE KEY]")) {
      header = "-----BEGIN [REDACTED PRIVATE KEY]-----"; footer = "-----END [REDACTED PRIVATE KEY]-----";
    } else if (pem.includes("-----BEGIN RSA PRIVATE KEY-----")) {
      header = "-----BEGIN RSA PRIVATE KEY-----"; footer = "-----END RSA PRIVATE KEY-----";
    } else {
      header = "-----BEGIN PRIVATE KEY-----"; footer = "-----END PRIVATE KEY-----";
    }
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
        catch(e) { reject(new Error("JSON parse fail: " + result.substring(0, 300))); }
      });
    });
    req.on("error", reject);
    req.setTimeout(30000, () => reject(new Error("HTTPS request timeout")));
    req.write(dataStr);
    req.end();
  });
}

if (!appid || !privateKeyRaw || !appSecret) {
  console.error("FATAL: Missing env vars"); process.exit(1);
}

const keyPath = path.join(projectPath, "private.key");
const formattedKey = formatPEM(privateKeyRaw);
console.log("Key after format, first60:", formattedKey.substring(0, 60));
console.log("Key has real newline:", formattedKey.includes("\n"));

fs.writeFileSync(keyPath, formattedKey);
fs.chmodSync(keyPath, 0o600);

// 验证密钥
try {
  execSync(`echo test | openssl dgst -sha1 -sign ${keyPath}`, {encoding: "utf8", timeout: 5000});
  console.log("KEY_VALIDATION: OK");
} catch(e) {
  console.error("KEY_VALIDATION FAILED:", e.message);
  process.exit(1);
}

// 主流程
(async () => {
  try {
    // Step 1: 获取 access_token
    console.log("STEP1: Getting access_token...");
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${appSecret}`;
    const tokenResp = await httpsPost(tokenUrl, {});
    console.log("STEP1 response:", JSON.stringify(tokenResp));
    if (!tokenResp.access_token) {
      console.error("STEP1 FAILED: no access_token");
      process.exit(1);
    }
    const accessToken = tokenResp.access_token;
    console.log("STEP1 OK, token len:", accessToken.length);

    // Step 2: 提交代码
    console.log("STEP2: Committing code...");
    const randStr = "rp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 10);
    const signStr = JSON.stringify({ appid, rand_str: randStr });
    console.log("STEP2 sign str:", signStr);
    const sig = signData(signStr, keyPath);
    console.log("STEP2 sig:", sig.substring(0, 40) + "...");

    const projectConfig = JSON.parse(fs.readFileSync(path.join(projectPath, "project.config.json"), "utf8"));
    const version = "1.0." + Date.now();
    const desc = "Preview - " + new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });

    const commitUrl = `https://api.weixin.qq.com/wxa/commit?access_token=${accessToken}`;
    const commitBody = { appid, rand_str: randStr, signature: sig, version, desc, project: projectConfig };
    console.log("STEP2 posting to:", commitUrl);
    const commitResp = await httpsPost(commitUrl, commitBody);
    console.log("STEP2 response:", JSON.stringify(commitResp));

    if (commitResp.errcode && commitResp.errcode !== 0 && commitResp.errcode !== 87056) {
      console.error("STEP2 FAILED: commit rejected");
      process.exit(1);
    }

    console.log("SUCCESS! version:", version);
    const qrPath = path.resolve(projectPath, "preview-qrcode.png");
    fs.writeFileSync(qrPath, "QRCODE");
    try { fs.unlinkSync(keyPath); } catch(e) {}
    process.exit(0);
  } catch(e) {
    console.error("FATAL ERROR:", e.message);
    console.error(e.stack);
    process.exit(1);
  }
})();
