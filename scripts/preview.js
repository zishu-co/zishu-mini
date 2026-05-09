const ci = require("miniprogram-ci");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const crypto = require("crypto");

const projectPath = process.env.PROJECT_PATH || process.cwd();

(async () => {
  const appid = process.env.APPID;
  const privateKeyRaw = (process.env.PRIVATE_KEY || "").trim();
  const appSecret = (process.env.APP_SECRET || "").trim();

  if (!appid || !privateKeyRaw || !projectPath) {
    console.error("Missing required env vars: APPID, PRIVATE_KEY, PROJECT_PATH");
    process.exit(1);
  }

  // 格式化 PEM
  let pemKey = privateKeyRaw;
  if (!pemKey.includes("\n") && pemKey.includes("-----BEGIN")) {
    let header, footer;
    if (pemKey.includes("-----BEGIN PRIVATE KEY-----")) {
      header = "-----BEGIN PRIVATE KEY-----"; footer = "-----END PRIVATE KEY-----";
    } else if (pemKey.includes("-----BEGIN RSA PRIVATE KEY-----")) {
      header = "-----BEGIN RSA PRIVATE KEY-----"; footer = "-----END RSA PRIVATE KEY-----";
    } else {
      console.error("Unknown key format");
      process.exit(1);
    }
    const body = pemKey.replace(header, "").replace(footer, "");
    const lines = body.match(/.{1,64}/g) || [];
    pemKey = header + "\n" + lines.join("\n") + "\n" + footer;
  }

  // 写私钥文件
  const privateKeyPath = path.join(projectPath, "private.key");
  fs.writeFileSync(privateKeyPath, pemKey);
  fs.chmodSync(privateKeyPath, 0o600);
  console.log("密钥已写入");

  // ============================================================
  // 修复 miniprogram-ci sign.js
  // Node.js 22+ OpenSSL 3.x 不再支持 RSA PKCS#1 v1.5 加密
  // 改用 openssl dgst -sha1 -sign（微信官方签名方式）
  // ============================================================
  const signJsPath = path.join(projectPath, "node_modules/miniprogram-ci/dist/utils/sign.js");
  let signJsContent = fs.readFileSync(signJsPath, "utf8");

  if (!signJsContent.includes("PATCHED_V2")) {
    // 找到 getSignature 函数（单行模式匹配）
    const oldSignPattern = /async function getSignature\(r, e\)\{const t=\{appid:e,rand_str:await getRandomString\(e)\};try\{return crypto_1\.default\.privateEncrypt\(\{key:r,padding:crypto_1\.default\.constants\.RSA_PKCS1_PADDING\},Buffer\.from\(JSON\.stringify\(t\)\)\)\.toString\("base64"\)\}catch\(r\)\{throw new error_1\.CodeError\(locales_1\.default\.config\.GENERATE_LOCAL_SIGNATURE_FAIL\.format\(r\.toString\(\)\),config_1\.GENERATE_LOCAL_SIGNATURE_ERR\)\}\}/;

    const newSignFunc = `async function getSignature(r, e) {
  const t = { appid: e, rand_str: await getRandomString(e) };
  const dataStr = JSON.stringify(t);
  try {
    // 使用 openssl dgst -sha1 -sign（微信官方签名方式）
    const sig = execSync(
      "echo '" + Buffer.from(dataStr).toString("base64") + "' | base64 -d | openssl dgst -sha1 -sign " + r,
      { encoding: "utf8", timeout: 15000 }
    );
    return sig.trim();
  } catch (err) {
    throw new error_1.CodeError(
      locales_1.default.config.GENERATE_LOCAL_SIGNATURE_FAIL.format(err.message),
      config_1.GENERATE_LOCAL_SIGNATURE_ERR
    );
  }
}
// PATCHED_V2`;

    signJsContent = signJsContent.replace(oldSignPattern, newSignFunc);
    fs.writeFileSync(signJsPath, signJsContent);
    console.log("sign.js 已 patch: openssl dgst -sha1 -sign");
  }

  const project = new ci.Project({
    appid,
    type: "miniProgram",
    projectPath,
    privateKey: privateKeyPath,
  });

  const qrcodeOutputPath = path.resolve(projectPath, "preview-qrcode.png");

  console.log("开始预览...");
  console.log("appid:", appid);

  const previewOptions = {
    project,
    desc: "预览发布 - " + new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
    setting: { es6: true, enhance: true, postcss: true, minified: true },
    qrcodeFormat: "image",
    qrcodeOutputDest: qrcodeOutputPath,
  };

  if (appSecret) {
    previewOptions.appSecret = appSecret;
    console.log("使用 APP_SECRET 认证");
  }

  const result = await ci.preview(previewOptions);
  console.log("预览成功:", JSON.stringify(result, null, 2));
  console.log("二维码:", qrcodeOutputPath);

  try { fs.unlinkSync(privateKeyPath); } catch (e) {}
})();
