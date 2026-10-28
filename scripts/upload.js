const ci = require("miniprogram-ci");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

(async () => {
  const appid = (process.env.APPID || "wxb733ab430ac1a423").trim();
  let privateKey = (process.env.PRIVATE_KEY || "").trim();
  const projectPath = process.env.PROJECT_PATH || process.cwd();
  const version = process.env.UPLOAD_VERSION || "1.4.6";
  const desc = process.env.UPLOAD_DESC || "momo分支 UI与交互全面升级 (CI自动上传)";

  if (!appid || !privateKey) {
    console.error("缺少必要的环境变量: APPID 或 PRIVATE_KEY");
    process.exit(1);
  }

  // 1. 兼容单行或缺失换行的 PEM 私钥格式
  if (privateKey.includes("-----BEGIN")) {
    const isPkcs8 = privateKey.includes("-----BEGIN PRIVATE KEY-----");
    const header = isPkcs8
      ? "-----BEGIN PRIVATE KEY-----"
      : "-----BEGIN RSA PRIVATE KEY-----";
    const footer = isPkcs8
      ? "-----END PRIVATE KEY-----"
      : "-----END RSA PRIVATE KEY-----";
    const body = privateKey
      .replace(header, "")
      .replace(footer, "")
      .replace(/\s+/g, "");
    const lines = body.match(/.{1,64}/g) || [];
    privateKey = `${header}\n${lines.join("\n")}\n${footer}\n`;
  } else {
    // 裸 base64 字符串兜底包装
    const cleanBody = privateKey.replace(/\s+/g, "");
    const lines = cleanBody.match(/.{1,64}/g) || [];
    privateKey = `-----BEGIN RSA PRIVATE KEY-----\n${lines.join("\n")}\n-----END RSA PRIVATE KEY-----\n`;
  }

  const privateKeyPath = path.join(projectPath, "private.key");
  fs.writeFileSync(privateKeyPath, privateKey, { mode: 0o600 });

  // 2. 验证 Node.js crypto.privateEncrypt 是否可直接解析该私钥；若需 PKCS#8 转换则通过 openssl 转换
  try {
    crypto.privateEncrypt(
      { key: privateKey, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from("test")
    );
    console.log("私钥验证通过 (Node.js crypto.privateEncrypt 直接可用)");
  } catch (err) {
    console.log("尝试通过 openssl 标准化私钥格式:", err.message);
    try {
      const converted = execSync(
        `openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in "${privateKeyPath}"`,
        { encoding: "utf8" }
      );
      if (converted.includes("BEGIN PRIVATE KEY")) {
        privateKey = converted;
        fs.writeFileSync(privateKeyPath, privateKey, { mode: 0o600 });
        console.log("已通过 openssl pkcs8 标准化私钥");
      }
    } catch (osslErr) {
      console.warn("openssl 转换提示:", osslErr.message);
    }
  }

  console.log("开始上传小程序代码包...");
  console.log("AppID:", appid);
  console.log("Version:", version);
  console.log("Desc:", desc);

  try {
    const project = new ci.Project({
      appid,
      type: "miniProgram",
      projectPath,
      privateKey,
      privateKeyPath,
      ignores: ["node_modules/**/*", "private.key", ".git/**/*"],
    });

    const uploadResult = await ci.upload({
      project,
      version,
      desc,
      setting: {
        es6: true,
        es7: true,
        enhance: true,
        postcss: true,
        minified: true,
        autoPrefixWXSS: true,
        useCompilerPlugins: ["typescript"],
      },
      onProgressUpdate: (task) => {
        if (task && task._status === "done") {
          console.log(`[进度] ${task._msg || "done"}`);
        }
      },
    });

    console.log("=== 上传成功 ===");
    console.log(JSON.stringify(uploadResult, null, 2));
  } catch (uploadErr) {
    console.error("=== 上传失败 ===", uploadErr);
    process.exit(1);
  } finally {
    try {
      fs.unlinkSync(privateKeyPath);
    } catch (_) {}
  }
})();
