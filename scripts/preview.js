const ci = require("miniprogram-ci");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

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
    } else {
      header = "-----BEGIN RSA PRIVATE KEY-----"; footer = "-----END RSA PRIVATE KEY-----";
    }
    const body = pemKey.replace(header, "").replace(footer, "");
    const lines = body.match(/.{1,64}/g) || [];
    pemKey = header + "\n" + lines.join("\n") + "\n" + footer;
  }

  const privateKeyPath = path.join(projectPath, "private.key");
  fs.writeFileSync(privateKeyPath, pemKey);
  fs.chmodSync(privateKeyPath, 0o600);

  // ============================================================
  // Patch miniprogram-ci sign.js
  // 使用 openssl dgst -sha1 -sign 替代 crypto.privateEncrypt
  // 解决 Node.js 22 + OpenSSL 3.x 的兼容性问题
  // ============================================================
  const signJsPath = path.join(projectPath, "node_modules/miniprogram-ci/dist/utils/sign.js");
  let signJsContent = fs.readFileSync(signJsPath, "utf8");

  // 查找原始 getSignature 函数（包含 privateEncrypt 的那一行）
  const marker = "GENERATE_LOCAL_SIGNATURE_FAIL";
  if (!signJsContent.includes("PATCHED_V3") && signJsContent.includes(marker)) {
    // 用简单的字符串替换：找到包含 privateEncrypt 的那一行并替换
    const lines = signJsContent.split("\n");
    let found = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("privateEncrypt") && lines[i].includes("RSA_PKCS1_PADDING")) {
        // 找到目标行，替换为 openssl dgst 调用
        lines[i] = lines[i].replace(
          /return crypto_1\.default\.privateEncrypt\(\{key:r,padding:crypto_1\.default\.constants\.RSA_PKCS1_PADDING\},Buffer\.from\(JSON\.stringify\(t\)\)\)\.toString\("base64"\)/,
          'return execSync("echo \'${Buffer.from(JSON.stringify(t)).toString("base64")}\' | base64 -d | openssl dgst -sha1 -sign " + r, {encoding:"utf8",timeout:15000}).trim()'
        );
        found = true;
        console.log("sign.js 已 patch：替换 privateEncrypt 为 openssl dgst");
        break;
      }
    }
    if (found) {
      signJsContent = lines.join("\n");
      // 在文件末尾加 marker
      signJsContent += "\n// PATCHED_V3";
      fs.writeFileSync(signJsPath, signJsContent);
    } else {
      console.error("未找到 privateEncrypt 目标行！");
    }
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

  try { fs.unlinkSync(privateKeyPath); } catch (e) {}
})();
