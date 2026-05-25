const DEFAULT_CONFIG = {
  enabled: true,
  selector: "",
  text: "",
  ariaLabel: "",
  clickOnce: true,
  exactText: false,
  visibleOnly: true,
  delayMs: 0,
  startAtMs: 0,
  workflowEnabled: true,
  workflowSteps: "",
  workflowStartStep: 1
};

const fields = {
  enabled: document.querySelector("#enabled"),
  startAt: document.querySelector("#startAt"),
  workflowSteps: document.querySelector("#workflowSteps"),
  workflowStartStep: document.querySelector("#workflowStartStep")
};

const status = document.querySelector("#status");
const countdown = document.querySelector("#countdown");
const workflowStatus = document.querySelector("#workflowStatus");
const workflowTarget = document.querySelector("#workflowTarget");

let countdownTimer = 0;
let workflowStatusTimer = 0;
let scheduledStartAtMs = 0;

function setStatus(message) {
  status.textContent = message;
  window.setTimeout(() => {
    if (status.textContent === message) status.textContent = "";
  }, 3000);
}

function readForm() {
  const startAtMs = fields.startAt.value ? new Date(fields.startAt.value).getTime() : 0;

  return {
    enabled: fields.enabled.checked,
    selector: "",
    text: "",
    ariaLabel: "",
    clickOnce: true,
    exactText: false,
    visibleOnly: true,
    delayMs: 0,
    startAtMs: Number.isFinite(startAtMs) ? startAtMs : 0,
    workflowEnabled: true,
    workflowSteps: fields.workflowSteps.value.trim(),
    workflowStartStep: Math.max(1, Math.floor(Number(fields.workflowStartStep.value || 1)))
  };
}

function toDateTimeLocalValue(ms) {
  if (!ms) return "";

  const date = new Date(ms);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 19);
}

function writeForm(config) {
  fields.enabled.checked = Boolean(config.enabled);
  fields.startAt.value = toDateTimeLocalValue(config.startAtMs);
  fields.workflowSteps.value = config.workflowSteps || "";
  fields.workflowStartStep.value = config.workflowStartStep || 1;
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function renderCountdown() {
  if (!scheduledStartAtMs) {
    countdown.textContent = "尚未開始倒數";
    return;
  }

  const diff = scheduledStartAtMs - Date.now();
  countdown.textContent = diff > 0
    ? `倒數 ${formatDuration(diff)}`
    : "時間已到，正在執行";

  if (diff <= 0 && countdownTimer) {
    window.clearInterval(countdownTimer);
    countdownTimer = 0;
  }
}

function startCountdownDisplay(startAtMs) {
  scheduledStartAtMs = Number(startAtMs || 0);
  if (countdownTimer) window.clearInterval(countdownTimer);
  renderCountdown();
  if (scheduledStartAtMs > Date.now()) {
    countdownTimer = window.setInterval(renderCountdown, 200);
  }
}

async function saveSettings() {
  const config = readForm();
  JSON.parse(config.workflowSteps || "[]");
  await chrome.storage.sync.set(config);
  return config;
}

async function save() {
  try {
    await saveSettings();
    setStatus("設定已儲存。尚未開始倒數。");
  } catch (error) {
    setStatus(error.message);
  }
}

async function sendToActiveTab(message) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return null;
  return chrome.tabs.sendMessage(tab.id, message);
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

async function ensureActiveTabReady() {
  const tab = await getActiveTab();
  if (!tab?.id || !tab.url) {
    return { ok: false, message: "找不到目前分頁。" };
  }

  if (!/^https?:|^file:/.test(tab.url)) {
    return { ok: false, message: "這個頁面不能執行 content script。" };
  }

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "fast-clicker-ping" });
    return { ok: true };
  } catch {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });
      return { ok: true };
    } catch {
      if (tab.url.startsWith("file:")) {
        return { ok: false, message: "file 頁面需要先允許擴充功能存取檔案網址。" };
      }
      return { ok: false, message: "無法載入 content script，請重新整理頁面後再試。" };
    }
  }
}

async function clearScheduledStart() {
  await chrome.runtime.sendMessage({ type: "fast-clicker-clear-start" }).catch(() => null);
  startCountdownDisplay(0);
}

async function runImmediately() {
  try {
    const config = await saveSettings();
    await clearScheduledStart();

    const tabStatus = await ensureActiveTabReady();
    if (!tabStatus.ok) {
      setStatus(tabStatus.message);
      return;
    }

    const result = await sendToActiveTab({
      type: "fast-clicker-run-now",
      ignoreEnabled: true,
      startStep: config.workflowStartStep
    }).catch(() => null);
    setResultStatus(result);
  } catch (error) {
    setStatus(error.message);
  }
}

async function armScheduledStart() {
  try {
    const config = await saveSettings();
    const startAtMs = Number(config.startAtMs || 0);

    if (!startAtMs || !Number.isFinite(startAtMs)) {
      setStatus("請先設定指定開始時間。");
      return;
    }

    if (startAtMs <= Date.now()) {
      setStatus("指定開始時間必須晚於現在。");
      return;
    }

    const tabStatus = await ensureActiveTabReady();
    if (!tabStatus.ok) {
      setStatus(tabStatus.message);
      return;
    }

    const tab = await getActiveTab();
    await chrome.runtime.sendMessage({
      type: "fast-clicker-schedule-start",
      tabId: tab?.id || 0,
      startAtMs,
      startStep: config.workflowStartStep
    });

    startCountdownDisplay(startAtMs);
    setStatus("倒數已開始，時間到會立刻執行。");
  } catch (error) {
    setStatus(error.message);
  }
}

function setResultStatus(result) {
  if (result?.clicked) {
    const stepText = Number.isInteger(result.index) ? `第 ${result.index + 1} 步` : "";
    setStatus(`已執行 ${stepText}`);
  } else if (result?.ok) {
    const stepText = Number.isInteger(result.index) ? `第 ${result.index + 1} 步` : "";
    setStatus(`${stepText} 未找到目標：${result.reason || "unknown"}`);
  } else {
    setStatus(result?.reason || "執行失敗，請確認頁面是否已重新整理。");
  }
}

function renderWorkflowStatus(data) {
  if (!data) {
    workflowStatus.textContent = "尚未執行";
    workflowTarget.textContent = "";
    return;
  }

  const step = Number.isInteger(data.index) && Number.isInteger(data.total)
    ? `第 ${data.index + 1} / ${data.total} 步`
    : "流程";
  const action = data.action ? ` ${data.action}` : "";

  if (data.state === "running") {
    workflowStatus.textContent = data.reason === "waiting-for-target"
      ? `正在等待 ${step}${action}`
      : `正在執行 ${step}${action}`;
  } else if (data.state === "blocked") {
    workflowStatus.textContent = `卡在 ${step}: ${data.reason || "unknown"}`;
  } else if (data.state === "done") {
    workflowStatus.textContent = `完成 ${step}${action}`;
  } else if (data.state === "finished") {
    workflowStatus.textContent = "流程已完成";
  } else if (data.state === "waiting") {
    workflowStatus.textContent = "等待指定時間";
  } else if (data.state === "reset") {
    workflowStatus.textContent = Number.isInteger(data.index)
      ? `已重設到第 ${data.index + 1} 步`
      : "已重設流程";
  } else {
    workflowStatus.textContent = `${step}: ${data.reason || data.state || "unknown"}`;
  }

  workflowTarget.textContent = data.target ? `目標：${data.target}` : "";
}

async function refreshWorkflowStatus() {
  const result = await chrome.storage.local.get({ workflowStatus: null }).catch(() => ({ workflowStatus: null }));
  renderWorkflowStatus(result.workflowStatus);
}

async function resetActiveTabWorkflow() {
  const config = readForm();
  await ensureActiveTabReady();
  await sendToActiveTab({
    type: "fast-clicker-reset",
    startStep: config.workflowStartStep
  }).catch(() => null);
}

document.querySelector("#save").addEventListener("click", save);
document.querySelector("#test").addEventListener("click", runImmediately);
document.querySelector("#startCountdown").addEventListener("click", armScheduledStart);
document.querySelector("#cancelCountdown").addEventListener("click", async () => {
  await clearScheduledStart();
  setStatus("倒數已取消。");
});

document.querySelector("#clearTime").addEventListener("click", async () => {
  fields.startAt.value = "";
  await saveSettings();
  await clearScheduledStart();
  setStatus("時間已清除。");
});

document.querySelector("#sampleWorkflow").addEventListener("click", () => {
  fields.workflowSteps.value = JSON.stringify([
    { type: "click", selector: "#firstButton" },
    { type: "click", selector: "#quickButtons .quick-button" },
    { type: "click", selector: "#secondButton" },
    { type: "click", selector: "div.seat-item", textIncludes: ["5990"], waitForMs: 10000 },
    { type: "select", selector: "#ticketCount", value: "2" },
    { type: "check", selector: "#agreeTerms" },
    { type: "click", selector: "#finishButton" }
  ], null, 2);
  fields.workflowStartStep.value = "1";
  setStatus("範例已載入，尚未執行。");
});

document.querySelector("#resetWorkflow").addEventListener("click", async () => {
  await resetActiveTabWorkflow();
  await chrome.storage.local.set({ workflowStatus: null }).catch(() => null);
  renderWorkflowStatus(null);
  setStatus("流程進度已重設。");
});

fields.enabled.addEventListener("change", save);
fields.startAt.addEventListener("change", () => startCountdownDisplay(scheduledStartAtMs));

chrome.storage.sync.get(DEFAULT_CONFIG).then(async (config) => {
  writeForm(config);

  const schedule = await chrome.storage.local.get({
    scheduledStartAtMs: 0
  }).catch(() => ({ scheduledStartAtMs: 0 }));
  startCountdownDisplay(schedule.scheduledStartAtMs);

  refreshWorkflowStatus();
  workflowStatusTimer = window.setInterval(refreshWorkflowStatus, 500);
});

window.addEventListener("unload", () => {
  if (countdownTimer) window.clearInterval(countdownTimer);
  if (workflowStatusTimer) window.clearInterval(workflowStatusTimer);
});
