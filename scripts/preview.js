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
  // 完全重写 sign.js，移除对 crypto.privateEncrypt 的依赖
  // ============================================================
  const signJsPath = path.join(projectPath, "node_modules/miniprogram-ci/dist/utils/sign.js");

  // 检查是否已经 patch 过
  if (!fs.readFileSync(signJsPath, "utf8").includes("PATCHED_FINAL")) {
    const newSignJs = `"use strict";Object.defineProperty(exports,"__esModule",{value:!0}),exports.getSignature=exports.getRandomString=void 0;const tslib_1=require("tslib"),config_1=require("../config/config"),url_config_1=require("../config/url.config"),request_1=require("./request"),error_1=require("./error"),locales_1=tslib_1.__importDefault(require("./locales/locales")),jsonParse_1=require("./jsonParse");async function getRandomString(r){try{const{body:e}=await(0,request_1.request)({url:url_config_1.GET_RAND_STRING,method:"post",body:JSON.stringify({appid:r,clientRand:Math.floor(1e8*Math.random())}),headers:{"content-type":"application/json"}}),t=(0,jsonParse_1.jsonRespParse)(e,url_config_1.GET_RAND_STRING);if(0===t.errCode)return t.data.randomString;throw new Error("errCode: "+t.errCode+"; errMsg: "+t.errMsg)}catch(r){throw new error_1.CodeError(r.toString(),config_1.GET_SIGNATURE_RAND_STRING_ERR)}}async function getSignature(r,e){const t={appid:e,rand_str:await getRandomString(e)};const dataStr=JSON.stringify(t);try{const {execSync:s}=require("child_process");const sig=s("echo '"+Buffer.from(dataStr).toString("base64")+"' | base64 -d | openssl dgst -sha1 -sign "+r,{encoding:"utf8",timeout:15000});return sig.toString().trim()}catch(r){throw new error_1.CodeError(locales_1.default.config.GENERATE_LOCAL_SIGNATURE_FAIL.format(r.toString()),config_1.GENERATE_LOCAL_SIGNATURE_ERR)}}exports.getRandomString=getRandomString,exports.getSignature=getSignature;
// PATCHED_FINAL`;

    fs.writeFileSync(signJsPath, newSignJs);
    console.log("sign.js 已完全重写：使用 openssl dgst -sha1 -sign");
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
