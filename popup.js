const DEFAULT_CONFIG = {
  enabled: false,
  selector: "",
  text: "",
  ariaLabel: "",
  clickOnce: true,
  exactText: false,
  visibleOnly: true,
  delayMs: 0,
  startAtMs: 0,
  workflowEnabled: false,
  workflowSteps: ""
};

const fields = {
  enabled: document.querySelector("#enabled"),
  selector: document.querySelector("#selector"),
  text: document.querySelector("#text"),
  ariaLabel: document.querySelector("#ariaLabel"),
  clickOnce: document.querySelector("#clickOnce"),
  exactText: document.querySelector("#exactText"),
  visibleOnly: document.querySelector("#visibleOnly"),
  delayMs: document.querySelector("#delayMs"),
  startAt: document.querySelector("#startAt"),
  workflowEnabled: document.querySelector("#workflowEnabled"),
  workflowSteps: document.querySelector("#workflowSteps")
};

const status = document.querySelector("#status");
const countdown = document.querySelector("#countdown");
let countdownTimer = null;

function setStatus(message) {
  status.textContent = message;
  setTimeout(() => {
    if (status.textContent === message) status.textContent = "";
  }, 2500);
}

function readForm() {
  const startAtMs = fields.startAt.value ? new Date(fields.startAt.value).getTime() : 0;

  return {
    enabled: fields.enabled.checked,
    selector: fields.selector.value.trim(),
    text: fields.text.value.trim(),
    ariaLabel: fields.ariaLabel.value.trim(),
    clickOnce: fields.clickOnce.checked,
    exactText: fields.exactText.checked,
    visibleOnly: fields.visibleOnly.checked,
    delayMs: Math.max(0, Number(fields.delayMs.value || 0)),
    startAtMs: Number.isFinite(startAtMs) ? startAtMs : 0,
    workflowEnabled: fields.workflowEnabled.checked,
    workflowSteps: fields.workflowSteps.value.trim()
  };
}

function toDateTimeLocalValue(ms) {
  if (!ms) return "";

  const date = new Date(ms);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 19);
}

function writeForm(config) {
  fields.enabled.checked = config.enabled;
  fields.selector.value = config.selector;
  fields.text.value = config.text;
  fields.ariaLabel.value = config.ariaLabel;
  fields.clickOnce.checked = config.clickOnce;
  fields.exactText.checked = config.exactText;
  fields.visibleOnly.checked = config.visibleOnly;
  fields.delayMs.value = config.delayMs;
  fields.startAt.value = toDateTimeLocalValue(config.startAtMs);
  fields.workflowEnabled.checked = config.workflowEnabled;
  fields.workflowSteps.value = config.workflowSteps;
  updateCountdown(config);
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

function updateCountdown(config = readForm()) {
  if (countdownTimer) clearInterval(countdownTimer);

  if (!config.startAtMs) {
    countdown.textContent = "未設定倒數";
    return;
  }

  const render = () => {
    const diff = config.startAtMs - Date.now();
    countdown.textContent = diff > 0 ? `倒數 ${formatDuration(diff)}` : "時間已到，正在執行";
  };

  render();
  countdownTimer = setInterval(render, 250);
}

async function save() {
  const config = readForm();
  await chrome.storage.sync.set(config);
  const tabStatus = await ensureActiveTabReady();
  if (tabStatus.ok && config.enabled && (!config.startAtMs || config.startAtMs <= Date.now())) {
    await sendToActiveTab({ type: "fast-clicker-scan" }).catch(() => null);
  }
  updateCountdown(config);

  if (!tabStatus.ok) {
    setStatus(tabStatus.message);
  } else if (!config.enabled) {
    setStatus("已儲存，尚未啟用");
  } else if (config.startAtMs > Date.now()) {
    setStatus("已啟用，等待指定時間");
  } else {
    setStatus("已啟用並儲存");
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
    return { ok: false, message: "找不到目前分頁" };
  }

  if (!/^https?:|^file:/.test(tab.url)) {
    return { ok: false, message: "此頁面不允許執行" };
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
        return { ok: false, message: "請在擴充功能詳細資料開啟：允許存取檔案網址" };
      }
      return { ok: false, message: "無法注入目前分頁，請重新整理頁面" };
    }
  }
}

document.querySelector("#save").addEventListener("click", save);

document.querySelector("#test").addEventListener("click", async () => {
  await save();
  try {
    const result = await sendToActiveTab({ type: "fast-clicker-test" });
    if (result?.clicked) {
      const stepText = Number.isInteger(result.index) ? `第 ${result.index + 1} 步` : "";
      setStatus(`已執行${stepText}`);
    } else if (result?.ok) {
      const stepText = Number.isInteger(result.index) ? `第 ${result.index + 1} 步` : "";
      setStatus(`${stepText} 沒找到目標：${result.reason || "unknown"}`);
    } else {
      setStatus(result?.reason || "目前頁面無法測試");
    }
  } catch {
    setStatus("請重新整理頁面後再測試");
  }
});

document.querySelector("#clearTime").addEventListener("click", async () => {
  fields.startAt.value = "";
  await save();
});

document.querySelector("#sampleWorkflow").addEventListener("click", async () => {
  fields.workflowEnabled.checked = true;
  fields.workflowSteps.value = JSON.stringify([
    { type: "click", selector: "#firstButton" },
    { type: "click", text: "趕快點我" },
    { type: "click", selector: "#secondButton" },
    { type: "click", selector: "div.seat-item" },
    { type: "select", selector: "#ticketCount", value: "2" },
    { type: "check", selector: "#agreeTerms" },
    { type: "click", selector: "#finishButton" }
  ], null, 2);
  await chrome.storage.local.set({ workflowIndex: 0 });
  setStatus("已載入範例並重設進度");
});

document.querySelector("#resetWorkflow").addEventListener("click", async () => {
  await chrome.storage.local.set({ workflowIndex: 0 });
  setStatus("已重設流程進度");
});

fields.enabled.addEventListener("change", save);
fields.startAt.addEventListener("change", () => updateCountdown());

chrome.storage.sync.get(DEFAULT_CONFIG).then((config) => {
  writeForm(config);
});
