const ci = require("miniprogram-ci");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

(async () => {
  const appid = process.env.APPID;
  let privateKey = process.env.PRIVATE_KEY;
  const projectPath = process.env.PROJECT_PATH;

  if (!appid || !privateKey || !projectPath) {
    console.error("缺少必要的环境变量: APPID, PRIVATE_KEY, PROJECT_PATH");
    process.exit(1);
  }

  privateKey = privateKey.trim();

  // 格式化单行 PEM
  if (!privateKey.includes("\n") && privateKey.includes("-----BEGIN")) {
    let body, header, footer;
    if (privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      header = "-----BEGIN PRIVATE KEY-----"; footer = "-----END PRIVATE KEY-----";
    } else {
      header = "-----BEGIN RSA PRIVATE KEY-----"; footer = "-----END RSA PRIVATE KEY-----";
    }
    body = privateKey.replace(header, "").replace(footer, "");
    const lines = body.match(/.{1,64}/g) || [];
    privateKey = header + "\n" + lines.join("\n") + "\n" + footer;
    console.log("检测到单行格式密钥，已重新格式化");
  }

  // 将私钥写入临时文件
  const privateKeyPath = path.join(projectPath, "private.key");
  fs.writeFileSync(privateKeyPath, privateKey);
  fs.chmodSync(privateKeyPath, 0o600);

  // Patch miniprogram-ci 的签名模块，替换 crypto.privateEncrypt 为 openssl 命令
  const signJsPath = path.join(projectPath, "node_modules/miniprogram-ci/dist/utils/sign.js");
  let signJsContent = fs.readFileSync(signJsPath, "utf8");

  if (!signJsContent.includes("PATCHED_BY_ZISHU_CI")) {
    // 原始的 getSignature 函数
    const originalSign = `async function getSignature(r, e) { const t = { appid: e, rand_str: await getRandomString(e) }; try { return crypto_1.default.privateEncrypt({ key: r, padding: crypto_1.default.constants.RSA_PKCS1_PADDING }, Buffer.from(JSON.stringify(t))).toString("base64"); } catch (r) { throw new error_1.CodeError(locales_1.default.config.GENERATE_LOCAL_SIGNATURE_FAIL.format(r.toString()), config_1.GENERATE_LOCAL_SIGNATURE_ERR); } }`;

    // 用 openssl rsautl 替换
    const patchedSign = `async function getSignature(r, e) { const t = { appid: e, rand_str: await getRandomString(e) }; const dataStr = JSON.stringify(t); const keyPath = path.join(projectPath, "private.key"); try { const sig = execSync("echo '" + Buffer.from(dataStr).toString("base64") + "' | base64 -d | openssl rsautl -sign -inkey " + keyPath + " -keyform PEM -rsapadding | openssl base64 -A", { encoding: "utf8" }); return sig.trim(); } catch (err) { throw new error_1.CodeError(locales_1.default.config.GENERATE_LOCAL_SIGNATURE_FAIL.format(err.message), config_1.GENERATE_LOCAL_SIGNATURE_ERR); } }`;

    signJsContent = signJsContent.replace(originalSign, patchedSign + "\n// PATCHED_BY_ZISHU_CI");
    fs.writeFileSync(signJsPath, signJsContent);
    console.log("已 patch miniprogram-ci sign.js，替换为 openssl rsautl 签名");
  }

  const project = new ci.Project({
    appid,
    type: "miniProgram",
    projectPath,
    privateKey: privateKeyPath,
  });

  const qrcodeOutputPath = path.resolve(projectPath, "preview-qrcode.png");

  console.log("开始编译预览...");
  console.log("appid:", appid);
  console.log("projectPath:", projectPath);

  const previewResult = await ci.preview({
    project,
    desc: "预览发布 - " + new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
    setting: { es6: true, enhance: true, postcss: true, minified: true },
    qrcodeFormat: "image",
    qrcodeOutputDest: qrcodeOutputPath,
  });

  console.log("预览结果:", JSON.stringify(previewResult, null, 2));
  console.log("二维码已生成:", qrcodeOutputPath);

  try { fs.unlinkSync(privateKeyPath); } catch (e) { /* ignore */ }
})();
