const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const https = require("https");

const projectPath = process.env.PROJECT_PATH || process.cwd();
const privateKeyRaw = (process.env.PRIVATE_KEY || "").trim();
const appid = process.env.APPID;
const appSecret = (process.env.APP_SECRET || "").trim();

// formatPEM: 先把字面的 \n 替换成真实换行，再处理
function formatPEM(raw) {
  let pem = raw.trim();
  // GitHub Secrets 注入时会将真实换行转为字面 \n，需还原
  pem = pem.replace(/\\n/g, '\n');
  if (!pem.includes("\n") && pem.includes("-----BEGIN")) {
    let header, footer;
    if (pem.includes("[REDACTED PRIVATE KEY]")) {
      header = "-----BEGIN [REDACTED PRIVATE KEY]-----";
      footer = "-----END [REDACTED PRIVATE KEY]-----";
    } else if (pem.includes("-----BEGIN RSA PRIVATE KEY-----")) {
      header = "-----BEGIN RSA PRIVATE KEY-----";
      footer = "-----END RSA PRIVATE KEY-----";
    } else {
      header = "-----BEGIN PRIVATE KEY-----";
      footer = "-----END PRIVATE KEY-----";
    }
    const body = pem.replace(header, "").replace(footer, "");
    const lines = body.match(/.{1,64}/g) || [];
    pem = header + "\n" + lines.join("\n") + "\n" + footer;
  }
  return pem;
}

function signData(dataStr, keyPath) {
  const sig = execSync(
    `echo '${Buffer.from(dataStr).toString("base64")}' | base64 -d | openssl dgst -sha1 -sign ${keyPath}`,
    { encoding: "utf8", timeout: 15000 }
  );
  return sig.trim();
}

function httpsPost(url, body) {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(body);
    const req = https.request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "miniprogram-ci" }
    }, (res) => {
      let chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch(e) { reject(new Error("JSON parse error: " + Buffer.concat(chunks).toString().substring(0, 200))); }
      });
    });
    req.on("error", reject);
    req.write(dataStr);
    req.end();
  });
}

console.log("appid:", appid ? "SET" : "MISSING");
console.log("privateKey length:", privateKeyRaw.length);
console.log("privateKey first 50:", privateKeyRaw.substring(0, 50));
console.log("appSecret:", appSecret ? "SET" : "MISSING");

if (!appid || !privateKeyRaw || !appSecret) {
  console.error("Missing APPID, PRIVATE_KEY, or APP_SECRET");
  process.exit(1);
}

const keyPath = path.join(projectPath, "private.key");
const formattedKey = formatPEM(privateKeyRaw);
console.log("Formatted key first 60:", formattedKey.substring(0, 60));
console.log("Formatted key has real newlines:", formattedKey.includes("\n"));

fs.writeFileSync(keyPath, formattedKey);
fs.chmodSync(keyPath, 0o600);

// 验证密钥可用
try {
  execSync(`echo 'test' | openssl dgst -sha1 -sign ${keyPath}`, {encoding: "utf8", timeout: 5000});
  console.log("Key validation: OK");
} catch(e) {
  console.error("Key validation FAILED:", e.message);
  process.exit(1);
}

(async () => {
  // Step 1: 获取 access_token
  console.log("Step 1: Getting access_token...");
  const tokenResp = await httpsPost(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${appSecret}`,
    {}
  );
  console.log("access_token response:", JSON.stringify(tokenResp));
  if (!tokenResp.access_token) {
    console.error("access_token failed:", tokenResp);
    process.exit(1);
  }
  const accessToken = tokenResp.access_token;

  // Step 2: 生成随机字符串
  const randStr = "rp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 10);
  console.log("rand_str:", randStr);

  // Step 3: 签名
  const signDataStr = JSON.stringify({ appid, rand_str: randStr });
  const signature = signData(signDataStr, keyPath);
  console.log("Signature:", signature.substring(0, 40) + "...");

  // Step 4: 提交代码
  console.log("Step 4: Committing code...");
  const projectConfig = JSON.parse(fs.readFileSync(path.join(projectPath, "project.config.json"), "utf8"));
  const version = "1.0." + Date.now();
  const desc = "Preview - " + new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });

  const uploadResp = await httpsPost(
    `https://api.weixin.qq.com/wxa/commit?access_token=${accessToken}`,
    { appid, rand_str: randStr, signature, version, desc, project: projectConfig }
  );
  console.log("Upload response:", JSON.stringify(uploadResp));

  if (uploadResp.errcode && uploadResp.errcode !== 0 && uploadResp.errcode !== 87056) {
    console.error("Upload failed!");
    process.exit(1);
  }

  console.log("SUCCESS! version:", version);

  // 生成二维码占位
  const qrcodePath = path.resolve(projectPath, "preview-qrcode.png");
  fs.writeFileSync(qrcodePath, "PLACEHOLDER");
  try { fs.unlinkSync(keyPath); } catch(e) {}
})().catch(e => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
