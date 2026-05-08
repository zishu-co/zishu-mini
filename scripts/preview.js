
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const crypto = require("crypto");
const https = require("https");

const projectPath = process.env.PROJECT_PATH || process.cwd();
const keyPath = path.join(projectPath, "private.key");

// 从环境变量获取私钥并确保 PEM 格式正确
let privateKey = (process.env.PRIVATE_KEY || "").trim();
if (!privateKey) {
  console.error("PRIVATE_KEY not set!");
  process.exit(1);
}
console.log("PRIVATE_KEY length:", privateKey.length);

// 统一格式化为标准多行 PEM
if (!privateKey.includes("\n") && privateKey.includes("-----BEGIN")) {
  let header, footer;
  if (privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    header = "-----BEGIN PRIVATE KEY-----"; footer = "-----END PRIVATE KEY-----";
  } else {
    header = "-----BEGIN RSA PRIVATE KEY-----"; footer = "-----END RSA PRIVATE KEY-----";
  }
  const body = privateKey.replace(header,"").replace(footer,"");
  const lines = body.match(/.{1,64}/g) || [];
  privateKey = header + "\n" + lines.join("\n") + "\n" + footer;
  console.log("密钥已格式化");
}
fs.writeFileSync(keyPath, privateKey);
fs.chmodSync(keyPath, 0o600);
console.log("密钥已写入:", keyPath);

// ============ 关键：直接测试 access_token 获取 ============
const appid = process.env.APPID;
console.log("APPID:", appid);

// 直接调用微信 API 获取 access_token（HTTP GET，不需要签名）
// grant_type=client_credential 时只需要 appid + appsecret
// 但小程序预览用的是 auth_token 接口，需要 RSA 签名
// 先尝试获取 access_token
function httpGet(url, timeout=10000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "miniprogram-ci" } }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.setTimeout(timeout, () => { req.destroy(); reject(new Error("HTTP timeout")); });
  });
}

// 测试是否能访问微信 API
(async () => {
  console.log("\n=== 测试微信 API 连通性 ===");
  try {
    // 测试一个公开的 API（不需要 token）
    const testUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${appid}`;
    console.log("尝试访问:", testUrl.substring(0, 80));
    const resp = await httpGet(testUrl);
    console.log("API 响应:", resp.substring(0, 200));
  } catch(e) {
    console.error("API 访问失败:", e.message);
  }

  // ============ Monkey-patch crypto.privateEncrypt ============
  const originalPrivateEncrypt = crypto.privateEncrypt.bind(crypto);
  crypto.privateEncrypt = function(key, data, callback) {
    const dataStr = data.toString("utf8");
    console.log("\n>>> crypto.privateEncrypt 被调用, data.length:", dataStr.length);
    try {
      const sig = execSync(
        "openssl dgst -sha1 -sign " + keyPath,
        { input: Buffer.from(dataStr), timeout: 30000 }
      );
      const resultBuf = Buffer.from(sig.toString("base64"), "base64");
      console.log(">>> 签名成功, result.length:", resultBuf.length);
      if (typeof callback === "function") {
        callback(null, resultBuf);
      }
      return resultBuf;
    } catch (e) {
      console.error(">>> 签名失败:", e.message);
      if (typeof callback === "function") {
        callback(e);
      } else {
        throw e;
      }
    }
  };
  console.log("crypto.privateEncrypt 已 patch");

  // ============ 加载 miniprogram-ci ============
  const ci = require("miniprogram-ci");
  console.log("miniprogram-ci 版本:", ci.version || "unknown");

  const project = new ci.Project({
    appid,
    type: "miniProgram",
    projectPath,
    privateKey: keyPath,
  });

  const qrcodeOutputPath = path.resolve(projectPath, "preview-qrcode.png");
  console.log("\n开始编译预览...");
  console.log("appid:", appid);
  console.log("projectPath:", projectPath);

  ci.preview({
    project,
    desc: "预览发布 - " + new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
    setting: { es6: true, enhance: true, postcss: true, minified: true },
    qrcodeFormat: "image",
    qrcodeOutputDest: qrcodeOutputPath,
  }).then(result => {
    console.log("\n预览结果:", JSON.stringify(result, null, 2));
    console.log("二维码已生成:", qrcodeOutputPath);
  }).catch(err => {
    console.error("\n预览失败:", err.message);
    // 打印详细错误
    if (err.response) {
      console.error("Response data:", err.response.data);
    }
    process.exit(1);
  });
})();
