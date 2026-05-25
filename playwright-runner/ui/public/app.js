const form = document.querySelector("#runForm");
const workflowText = document.querySelector("#workflowText");
const statusText = document.querySelector("#statusText");
const eventLog = document.querySelector("#eventLog");
const loadExample = document.querySelector("#loadExample");
const clearLog = document.querySelector("#clearLog");

let pollTimer = 0;
let lastEventCount = 0;

async function setExample() {
  try {
    const response = await fetch("/api/examples");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "載入範例失敗");
    workflowText.value = data.practiceFlow;
    statusText.textContent = "已載入練習站範例";
  } catch (error) {
    statusText.textContent = error.message;
  }
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
  if (!response.ok) throw new Error(run.error || "讀取狀態失敗");

  statusText.textContent = run.error ? `${run.status}: ${run.error}` : run.status;
  run.events.slice(lastEventCount).forEach(appendEvent);
  lastEventCount = run.events.length;

  if (run.status === "completed" || run.status === "failed") {
    window.clearInterval(pollTimer);
    pollTimer = 0;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  window.clearInterval(pollTimer);
  lastEventCount = 0;
  eventLog.innerHTML = "";
  statusText.textContent = "準備執行...";

  const payload = {
    url: document.querySelector("#url").value,
    workflowText: workflowText.value,
    startStep: Number(document.querySelector("#startStep").value || 1),
    slowMo: Number(document.querySelector("#slowMo").value || 0),
    startAt: document.querySelector("#startAt").value,
    headless: document.querySelector("#headless").checked,
    closeOnFinish: document.querySelector("#closeOnFinish").checked
  };

  try {
    JSON.parse(payload.workflowText);
    const response = await fetch("/api/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "啟動失敗");

    statusText.textContent = `執行中：${data.id}`;
    pollTimer = window.setInterval(() => {
      pollRun(data.id).catch((error) => {
        statusText.textContent = error.message;
        window.clearInterval(pollTimer);
      });
    }, 700);
    await pollRun(data.id);
  } catch (error) {
    statusText.textContent = error.message;
  }
});

loadExample.addEventListener("click", setExample);

clearLog.addEventListener("click", () => {
  window.clearInterval(pollTimer);
  pollTimer = 0;
  lastEventCount = 0;
  eventLog.innerHTML = "";
  statusText.textContent = "尚未執行";
});

setExample();
