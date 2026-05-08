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

  // 确保私钥格式正确
  privateKey = privateKey.trim();

  // 如果是 PKCS#1 格式，转为 PKCS#8
  if (privateKey.includes("-----BEGIN RSA PRIVATE KEY-----")) {
    const tmpPath = path.join(projectPath, "tmp_private.key");
    fs.writeFileSync(tmpPath, privateKey);
    const cmd = "openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt < " + tmpPath + " 2>&1";
    const pkcs8 = execSync(cmd, { encoding: "utf8" });
    fs.unlinkSync(tmpPath);
    if (pkcs8.includes("-----BEGIN PRIVATE KEY-----")) {
      privateKey = pkcs8;
      console.log("密钥已从 PKCS#1 转换为 PKCS#8 格式");
    }
  }

  // 将私钥写入临时文件
  const privateKeyPath = path.join(projectPath, "private.key");
  fs.writeFileSync(privateKeyPath, privateKey);
  fs.chmodSync(privateKeyPath, 0o600);

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
  console.log("qrcodeOutputPath:", qrcodeOutputPath);

  const previewResult = await ci.preview({
    project,
    desc: "预览发布 - " + new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
    setting: {
      es6: true,
      enhance: true,
      postcss: true,
      minified: true,
    },
    qrcodeFormat: "image",
    qrcodeOutputDest: qrcodeOutputPath,
  });

  console.log("预览结果:", JSON.stringify(previewResult, null, 2));
  console.log("二维码已生成:", qrcodeOutputPath);

  // 清理私钥文件
  try {
    fs.unlinkSync(privateKeyPath);
  } catch (e) {
    // ignore
  }
})();
