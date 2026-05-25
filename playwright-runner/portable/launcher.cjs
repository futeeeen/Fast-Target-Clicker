const { existsSync } = require("node:fs");
const { dirname, join } = require("node:path");
const { execFile, spawn } = require("node:child_process");

const rootDir = process.pkg ? dirname(process.execPath) : __dirname;
const nodeExe = join(rootDir, "runtime", "node.exe");
const appDir = join(rootDir, "app");
const browsersDir = join(rootDir, "ms-playwright");
const serverPath = join(appDir, "ui", "server.mjs");
const port = process.env.PORT || "4280";
const url = `http://127.0.0.1:${port}`;

let child = null;

function openBrowser(targetUrl) {
  execFile("cmd", ["/c", "start", "", targetUrl], {
    windowsHide: true,
    stdio: "ignore"
  }).unref();
}

function stopChild() {
  if (child && !child.killed) {
    child.kill();
  }
}

function fail(message) {
  console.error(message);
  console.error("");
  console.error("請確認整個資料夾保持完整，且 app/runtime/ms-playwright 都和 exe 放在同一層。");
  process.exitCode = 1;
}

function main() {
  if (!existsSync(nodeExe)) {
    fail(`找不到 Node runtime: ${nodeExe}`);
    return;
  }

  if (!existsSync(serverPath)) {
    fail(`找不到 UI server: ${serverPath}`);
    return;
  }

  const env = {
    ...process.env,
    PORT: port,
    PLAYWRIGHT_BROWSERS_PATH: browsersDir
  };

  child = spawn(nodeExe, [serverPath], {
    cwd: rootDir,
    env,
    stdio: "inherit",
    windowsHide: false
  });

  child.on("exit", (code) => {
    process.exitCode = code || 0;
  });

  setTimeout(() => {
    openBrowser(url);
  }, 900);

  console.log("");
  console.log("Fast Target Clicker Playwright Runner 已啟動");
  console.log(`UI: ${url}`);
  console.log("關閉這個視窗即可停止本機服務。");
}

process.on("SIGINT", () => {
  stopChild();
  process.exit();
});

process.on("SIGTERM", () => {
  stopChild();
  process.exit();
});

process.on("exit", stopChild);

main();
