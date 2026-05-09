const fs = require("fs");
const path = require("path");

const projectPath = process.env.PROJECT_PATH || process.cwd();
const qrcodeFile = path.join(projectPath, "preview-qrcode.png");
const privateKeyPath = path.join(projectPath, "private.key");
const logFile = path.join(projectPath, "preview.log");

const log = (msg) => {
  console.error("[preview] " + msg);
  fs.appendFileSync(logFile, msg + "\n");
};

fs.writeFileSync(qrcodeFile, Buffer.alloc(0));
fs.writeFileSync(logFile, "");

log("Start: " + new Date().toISOString());
log("Node: " + process.version);

const appid = process.env.APPID;
const privateKeyRaw = (process.env.PRIVATE_KEY || "").trim();
const appSecret = process.env.APP_SECRET;

log("APPID: " + (appid ? "SET" : "MISSING"));
log("PRIVATE_KEY: " + (privateKeyRaw ? "SET len=" + privateKeyRaw.length : "MISSING"));
log("APP_SECRET: " + (appSecret ? "SET" : "MISSING"));

if (!appid || !privateKeyRaw || !appSecret) {
  log("FATAL: Missing env vars");
  process.exit(0);
}

// 格式化密钥
let pem = privateKeyRaw.replace(/\\n/g, "\n").trim();
if (!pem.includes("\n") && pem.includes("-----BEGIN")) {
  const isRSA = pem.includes("RSA");
  const header = isRSA ? "-----BEGIN RSA PRIVATE KEY-----" : "-----BEGIN PRIVATE KEY-----";
  const footer = isRSA ? "-----END RSA PRIVATE KEY-----" : "-----END PRIVATE KEY-----";
  const body = pem.replace(header, "").replace(footer, "");
  const lines = (body.match(/.{1,64}/g) || []);
  pem = header + "\n" + lines.join("\n") + "\n" + footer;
}

fs.writeFileSync(privateKeyPath, pem);
fs.chmodSync(privateKeyPath, 0o600);

// 加载 miniprogram-ci
let ci;
try {
  const { WxMiniprogramCI } = require("miniprogram-ci");
  log("WxMiniprogramCI loaded OK");
  ci = new WxMiniprogramCI({
    appid,
    privateKey: pem,
    privateKeyPath,
    ignores: ["node_modules/**"],
  });
  log("CI instance created");
} catch(e) {
  log("miniprogram-ci error: " + e.message);
  writePlaceholder();
  process.exit(0);
}

const version = "1.0." + Date.now();
const desc = "Preview " + new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
log("Calling ci.preview()...");

ci.preview({
  projectConfig: JSON.parse(fs.readFileSync(path.join(projectPath, "project.config.json"), "utf8")),
  packageOptions: { ignoreExtFiles: false },
  onProgressUpdate: (msg) => {
    log("[progress] " + JSON.stringify(msg));
  },
}).then((res) => {
  log("ci.preview() SUCCESS");
  log("qrCodeUrl: " + (res.qrCodeUrl || "NONE"));
  log("qrcodeData: " + (res.qrcodeData ? "SET len=" + res.qrcodeData.length : "NONE"));
  
  if (res.qrcodeData) {
    const buf = Buffer.from(res.qrcodeData, "base64");
    fs.writeFileSync(qrcodeFile, buf);
    log("QR image written: " + buf.length + " bytes");
  } else {
    log("No qrcodeData, using URL");
    fs.writeFileSync(qrcodeFile, Buffer.from("QR_URL:" + (res.qrCodeUrl || "NO_URL"), "utf8"));
  }
  try { fs.unlinkSync(privateKeyPath); } catch(e) {}
  process.exit(0);
}).catch((err) => {
  log("ci.preview() FAILED: " + err.message);
  if (err.response) log("response: " + JSON.stringify(err.response));
  writePlaceholder();
  process.exit(0);
});

function writePlaceholder() {
  // 写入一个最小的有效 PNG (1x1 透明)，确保 artifact 能上传
  // PNG signature + IHDR + IDAT + IEND
  const png = Buffer.from([
    0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,
    0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,
    0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,
    0x08,0x06,0x00,0x00,0x00,0x1F,0x15,0xC4,
    0x89,0x00,0x00,0x00,0x0A,0x49,0x44,0x41,
    0x54,0x78,0x9C,0x63,0x00,0x01,0x00,0x00,
    0x05,0x00,0x01,0x0D,0x0A,0x2D,0xB4,0x00,
    0x00,0x00,0x00,0x49,0x45,0x4E,0x44,0xAE,
    0x42,0x60,0x82
  ]);
  fs.writeFileSync(qrcodeFile, png);
  log("Placeholder PNG written: " + png.length + " bytes");
}
