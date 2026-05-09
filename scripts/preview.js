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

  // 格式化 PEM（统一多行格式）
  let pemKey = privateKeyRaw;
  if (!pemKey.includes("\n") && pemKey.includes("-----BEGIN")) {
    let header, footer;
    if (pemKey.includes("-----BEGIN PRIVATE KEY-----")) {
      header = "-----BEGIN PRIVATE KEY-----"; footer = "-----END PRIVATE KEY-----";
    } else {
      header = "-----BEGIN RSA PRIVATE KEY-----"; footer = "-----END RSA PRIVATE KEY-----";
    }
    const body = pemKey.replace(header, "").replace(footer, "");
    const lines = body.match(/.{1,64}/g) || [];
    pemKey = header + "\n" + lines.join("\n") + "\n" + footer;
    console.log("密钥已格式化");
  }

  // 写入私钥文件
  const privateKeyPath = path.join(projectPath, "private.key");
  fs.writeFileSync(privateKeyPath, pemKey);
  fs.chmodSync(privateKeyPath, 0o600);

  // =========================================================
  // 核心修复：patch miniprogram-ci 的 sign.js
  // 用 openssl rsautl 替代 crypto.privateEncrypt
  // 解决 Node.js v22 + OpenSSL 3.x 不支持 PKCS#8 的问题
  // =========================================================
  const signJsPath = path.join(projectPath, "node_modules/miniprogram-ci/dist/utils/sign.js");
  let signJsContent = fs.readFileSync(signJsPath, "utf8");

  if (!signJsContent.includes("PATCHED_BY_ZISHU_CI")) {
    // 找到 getSignature 函数并替换
    const oldFunc = /async function getSignature\(r, e\)\{const t=\{appid:e,rand_str:await getRandomString\(e\)\};try\{return crypto_1\.default\.privateEncrypt\(\{key:r,padding:crypto_1\.default\.constants\.RSA_PKCS1_PADDING\},Buffer\.from\(JSON\.stringify\(t\)\)\)\.toString\("base64"\)\}catch\(r\)\{throw new error_1\.CodeError\(locales_1\.default\.config\.GENERATE_LOCAL_SIGNATURE_FAIL\.format\(r\.toString\(\)\),config_1\.GENERATE_LOCAL_SIGNATURE_ERR\)\}\}/;

    const newFunc = `async function getSignature(r, e) {
  const t = { appid: e, rand_str: await getRandomString(e) };
  const dataStr = JSON.stringify(t);
  try {
    // 使用 openssl rsautl 替代 crypto.privateEncrypt
    const sig = execSync(
      "openssl rsautl -sign -inkey " + r + " -keyform PEM -rsapadding | openssl base64 -A",
      { input: Buffer.from(dataStr), timeout: 10000 }
    );
    return sig.toString().trim();
  } catch (err) {
    throw new error_1.CodeError(
      locales_1.default.config.GENERATE_LOCAL_SIGNATURE_FAIL.format(err.message),
      config_1.GENERATE_LOCAL_SIGNATURE_ERR
    );
  }
}
// PATCHED_BY_ZISHU_CI`;

    signJsContent = signJsContent.replace(oldFunc, newFunc);
    fs.writeFileSync(signJsPath, signJsContent);
    console.log("已 patch sign.js：用 openssl rsautl 替换 crypto.privateEncrypt");
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
  console.log("projectPath:", projectPath);

  const previewOptions = {
    project,
    desc: "预览发布 - " + new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
    setting: { es6: true, enhance: true, postcss: true, minified: true },
    qrcodeFormat: "image",
    qrcodeOutputDest: qrcodeOutputPath,
  };

  if (appSecret) {
    previewOptions.appSecret = appSecret;
    console.log("使用 APP_SECRET 进行认证");
  }

  const previewResult = await ci.preview(previewOptions);
  console.log("预览结果:", JSON.stringify(previewResult, null, 2));
  console.log("二维码已生成:", qrcodeOutputPath);

  try { fs.unlinkSync(privateKeyPath); } catch (e) { /* ignore */ }
})();
