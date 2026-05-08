const crypto = require("crypto");
const fs = require("fs");
const { execSync } = require("child_process");

const privateKey = process.env.PRIVATE_KEY;
const projectPath = process.env.PROJECT_PATH;

console.log("=== 密钥诊断 ===");
console.log("密钥长度:", privateKey ? privateKey.length : "未设置");
console.log("是否有换行符:", privateKey && privateKey.includes("\n") ? "是" : "否");
console.log("密钥头:", privateKey ? privateKey.substring(0, 60) : "N/A");

// Step 1: 格式化单行 PEM
let formattedKey = privateKey.trim();
if (!formattedKey.includes("\n") && formattedKey.includes("-----BEGIN")) {
  let body, type;
  if (formattedKey.includes("-----BEGIN PRIVATE KEY-----")) {
    body = formattedKey.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "");
    type = "PKCS#8";
  } else {
    body = formattedKey.replace("-----BEGIN RSA PRIVATE KEY-----", "").replace("-----END RSA PRIVATE KEY-----", "");
    type = "PKCS#1";
  }
  const lines = body.match(/.{1,64}/g) || [];
  formattedKey = (type === "PKCS#8" 
    ? "-----BEGIN PRIVATE KEY-----\n" 
    : "-----BEGIN RSA PRIVATE KEY-----\n") 
    + lines.join("\n") + "\n" 
    + (type === "PKCS#8" ? "-----END PRIVATE KEY-----" : "-----END RSA PRIVATE KEY-----");
  console.log("检测到单行格式，已重新格式化 (" + type + ")");
  console.log("格式化后行数:", lines.length);
}

// Step 2: 写入临时文件
const keyPath = projectPath + "/test_private.key";
fs.writeFileSync(keyPath, formattedKey);
fs.chmodSync(keyPath, 0o600);

// Step 3: 用 openssl 验证密钥
console.log("\n=== OpenSSL 验证 ===");
try {
  const check = execSync("openssl rsa -in " + keyPath + " -check -noout 2>&1", { encoding: "utf8" });
  console.log("openssl rsa -check:", check.trim());
} catch (e) {
  console.log("openssl rsa -check 失败:", e.stdout || e.message);
}

// Step 4: 测试 RSA 加密（用 Node.js crypto）
console.log("\n=== Node.js crypto 测试 ===");
try {
  const key = fs.readFileSync(keyPath, "utf8");
  
  // 测试用 PKCS#1 padding
  const data = JSON.stringify({ appid: "test", rand_str: "hello" });
  const encrypted1 = crypto.privateEncrypt(
    { key, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(data)
  );
  console.log("RSA_PKCS1_PADDING 加密成功，长度:", encrypted1.length);
} catch (e) {
  console.log("RSA_PKCS1_PADDING 加密失败:", e.message.split("\n")[0]);
}

// Step 5: 转为 PKCS#8 后测试
try {
  const pkcs8 = execSync("openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt < " + keyPath + " 2>&1", { encoding: "utf8" });
  if (pkcs8.includes("BEGIN PRIVATE KEY")) {
    fs.writeFileSync(keyPath, pkcs8);
    const key = fs.readFileSync(keyPath, "utf8");
    const data = JSON.stringify({ appid: "test", rand_str: "hello" });
    const encrypted2 = crypto.privateEncrypt(
      { key, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(data)
    );
    console.log("PKCS#8 + RSA_PKCS1_PADDING 加密成功，长度:", encrypted2.length);
  }
} catch (e) {
  console.log("PKCS#8 + RSA_PKCS1_PADDING 加密失败:", e.message.split("\n")[0]);
}

// Cleanup
try { fs.unlinkSync(keyPath); } catch (e) {}
