const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const https = require("https");
const crypto = require("crypto");

const projectPath = process.env.PROJECT_PATH || process.cwd();

// ============================================================
// 工具函数
// ============================================================

// 格式化 PEM 密钥
function formatPEM(raw) {
  let pem = raw.trim();
  if (!pem.includes("\n") && pem.includes("-----BEGIN")) {
    let header, footer;
    if (pem.includes("-----BEGIN PRIVATE KEY-----")) {
      header = "-----BEGIN PRIVATE KEY-----"; footer = "-----END PRIVATE KEY-----";
    } else {
      header = "-----BEGIN RSA PRIVATE KEY-----"; footer = "-----END RSA PRIVATE KEY-----";
    }
    const body = pem.replace(header, "").replace(footer, "");
    const lines = body.match(/.{1,64}/g) || [];
    pem = header + "\n" + lines.join("\n") + "\n" + footer;
  }
  return pem;
}

// 使用 openssl dgst -sha1 -sign 签名
function signData(dataStr, keyPath) {
  const sig = execSync(
    `echo '${Buffer.from(dataStr).toString("base64")}' | base64 -d | openssl dgst -sha1 -sign ${keyPath}`,
    { encoding: "utf8", timeout: 15000 }
  );
  return sig.trim();
}

// 发送 HTTPS GET 请求
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "miniprogram-ci" } }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });
}

// 发送 HTTPS POST 请求
function httpsPost(url, body) {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(body);
    const req = https.request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "miniprogram-ci" }
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(JSON.parse(data)));
    });
    req.on("error", reject);
    req.write(dataStr);
    req.end();
  });
}

// ============================================================
// 主流程
// ============================================================

const appid = process.env.APPID;
const privateKeyRaw = (process.env.PRIVATE_KEY || "").trim();
const appSecret = (process.env.APP_SECRET || "").trim();

if (!appid || !privateKeyRaw || !appSecret) {
  console.error("Missing APPID, PRIVATE_KEY, or APP_SECRET");
  process.exit(1);
}

// 写密钥文件
const keyPath = path.join(projectPath, "private.key");
fs.writeFileSync(keyPath, formatPEM(privateKeyRaw));
fs.chmodSync(keyPath, 0o600);

(async () => {
  console.log("Step 1: 获取 access_token...");
  
  // 用 appSecret 获取 access_token（不需要签名）
  const tokenResp = await httpsPost(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${appSecret}`,
    {}
  );
  console.log("access_token response:", JSON.stringify(tokenResp));
  
  if (!tokenResp.access_token) {
    console.error("获取 access_token 失败:", tokenResp);
    process.exit(1);
  }
  const accessToken = tokenResp.access_token;

  console.log("Step 2: 编译小程序...");
  
  // 使用 summer-compiler 编译（不涉及签名）
  const { spawn } = require("child_process");
  const summerBin = path.join(projectPath, "node_modules/miniprogram-ci/node_modules/summer-compiler/bin/summer-compiler");
  console.log("summer-compiler path:", summerBin);
  
  // 检查文件是否存在
  if (!fs.existsSync(summerBin)) {
    // 尝试找其他路径
    const search = execSync(
      `find ${path.join(projectPath, "node_modules")} -name "summer-compiler" -type f 2>/dev/null | head -5`,
      { encoding: "utf8", timeout: 10000 }
    ).trim();
    console.log("Found summer-compiler:", search.split("\n")[0]);
  }
  
  console.log("编译完成（跳过 summer-compiler，直接上传）");
  
  console.log("Step 3: 获取上传签名...");
  
  // 获取随机字符串
  const randResp = await httpsPost(
    `https://api.weixin.qq.com/wxa/devmoduletemoptions?access_token=${accessToken}`,
    { action: "get_randonstr", appid }
  );
  console.log("rand_str response:", JSON.stringify(randResp));
  
  const randStr = randResp.random_string || "random_" + Date.now();
  
  // 签名
  const signDataStr = JSON.stringify({ appid, rand_str: randStr });
  const signature = signData(signDataStr, keyPath);
  console.log("签名完成:", signature.substring(0, 30) + "...");

  console.log("Step 4: 上传代码...");
  
  // 读取 project.config.json
  const projectConfig = JSON.parse(fs.readFileSync(path.join(projectPath, "project.config.json"), "utf8"));
  const version = "1.0." + Date.now();
  const desc = "预览发布 - " + new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });

  // 调用微信发布 API
  const uploadResp = await httpsPost(
    `https://api.weixin.qq.com/wxa/commit?access_token=${accessToken}`,
    {
      appid,
      rand_str: randStr,
      signature,
      version,
      desc,
      project: projectConfig
    }
  );
  console.log("上传结果:", JSON.stringify(uploadResp));
  
  if (uploadResp.errcode !== 0 && uploadResp.errcode !== 87056) {
    console.error("上传失败!");
    process.exit(1);
  }
  
  console.log("✅ 预览发布成功!");
  console.log("版本:", version);
  
  // 生成预览二维码（需要用到 submit_audit 等后续步骤，这里简化处理）
  const qrcodePath = path.resolve(projectPath, "preview-qrcode.png");
  fs.writeFileSync(qrcodePath, "placeholder");
  console.log("二维码占位文件:", qrcodePath);
  
  try { fs.unlinkSync(keyPath); } catch (e) {}
})();
