const form = document.querySelector("#runForm");
const workflowText = document.querySelector("#workflowText");
const statusText = document.querySelector("#statusText");
const countdownText = document.querySelector("#countdownText");
const eventLog = document.querySelector("#eventLog");
const loadExample = document.querySelector("#loadExample");
const clearLog = document.querySelector("#clearLog");
const startCountdown = document.querySelector("#startCountdown");
const cancelCountdown = document.querySelector("#cancelCountdown");

let pollTimer = 0;
let countdownTimer = 0;
let countdownRunTimer = 0;
let scheduledStartAtMs = 0;
let lastEventCount = 0;

async function setExample() {
  try {
    const response = await fetch("/api/examples");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "載入範例失敗。");
    workflowText.value = data.practiceFlow;
    statusText.textContent = "已載入練習站範例。";
  } catch (error) {
    statusText.textContent = error.message;
  }
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

function readPayload() {
  const workflow = workflowText.value.trim();
  JSON.parse(workflow);

  return {
    url: document.querySelector("#url").value,
    workflowText: workflow,
    startStep: Number(document.querySelector("#startStep").value || 1),
    slowMo: Number(document.querySelector("#slowMo").value || 0),
    headless: document.querySelector("#headless").checked,
    closeOnFinish: document.querySelector("#closeOnFinish").checked
  };
}

function appendEvent(event) {
  const node = document.createElement("div");
  node.className = `event ${event.type === "error" ? "error" : ""} ${event.type === "complete" ? "complete" : ""}`;
  node.innerHTML = `
    <strong>${event.message || event.type}</strong>
    <small>${new Date(event.at).toLocaleTimeString()}</small>
  `;
  eventLog.prepend(node);
}

async function pollRun(id) {
  const response = await fetch(`/api/runs/${encodeURIComponent(id)}`);
  const run = await response.json();
  if (!response.ok) throw new Error(run.error || "讀取執行狀態失敗。");

  statusText.textContent = run.error ? `${run.status}: ${run.error}` : run.status;
  run.events.slice(lastEventCount).forEach(appendEvent);
  lastEventCount = run.events.length;

  if (run.status === "completed" || run.status === "failed") {
    window.clearInterval(pollTimer);
    pollTimer = 0;
  }
}

function clearRunPoll() {
  if (pollTimer) window.clearInterval(pollTimer);
  pollTimer = 0;
}

function resetLog(message = "準備就緒") {
  clearRunPoll();
  lastEventCount = 0;
  eventLog.innerHTML = "";
  statusText.textContent = message;
}

async function runNow() {
  clearCountdown(false);
  resetLog("準備執行...");

  try {
    const payload = readPayload();
    const response = await fetch("/api/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "啟動執行失敗。");

    statusText.textContent = `執行中：${data.id}`;
    pollTimer = window.setInterval(() => {
      pollRun(data.id).catch((error) => {
        statusText.textContent = error.message;
        clearRunPoll();
      });
    }, 700);
    await pollRun(data.id);
  } catch (error) {
    statusText.textContent = error.message;
  }
}

function clearCountdown(updateText = true) {
  if (countdownTimer) window.clearInterval(countdownTimer);
  if (countdownRunTimer) window.clearTimeout(countdownRunTimer);
  countdownTimer = 0;
  countdownRunTimer = 0;
  scheduledStartAtMs = 0;
  if (updateText) countdownText.textContent = "尚未開始倒數";
}

function renderCountdown() {
  const diff = scheduledStartAtMs - Date.now();
  if (diff <= 0) {
    clearCountdown(false);
    countdownText.textContent = "時間已到，正在執行。";
    runNow();
    return;
  }

  countdownText.textContent = `倒數 ${formatDuration(diff)}`;
}

function armCountdown() {
  try {
    readPayload();
    const startValue = document.querySelector("#startAt").value;
    const startAtMs = startValue ? new Date(startValue).getTime() : 0;

    if (!startAtMs || !Number.isFinite(startAtMs)) {
      throw new Error("請先選擇指定開始時間。");
    }

    if (startAtMs <= Date.now()) {
      throw new Error("指定開始時間必須晚於現在。");
    }

    resetLog("倒數已開始，時間到會立刻執行。");
    scheduledStartAtMs = startAtMs;
    renderCountdown();
    countdownTimer = window.setInterval(renderCountdown, 200);
    countdownRunTimer = window.setTimeout(() => {
      clearCountdown(false);
      countdownText.textContent = "時間已到，正在執行。";
      runNow();
    }, startAtMs - Date.now());
  } catch (error) {
    statusText.textContent = error.message;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await runNow();
});

loadExample.addEventListener("click", setExample);
startCountdown.addEventListener("click", armCountdown);

cancelCountdown.addEventListener("click", () => {
  clearCountdown(true);
  statusText.textContent = "倒數已取消。";
});

clearLog.addEventListener("click", () => {
  resetLog("準備就緒");
});

setExample();
