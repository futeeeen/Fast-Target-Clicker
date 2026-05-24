const ALARM_NAME = "fast-target-clicker-start";

async function ensureTabReady(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: "fast-clicker-ping" });
    return true;
  } catch {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"]
      });
      return true;
    } catch {
      return false;
    }
  }
}

async function scheduleStart(tabId, startAtMs) {
  await chrome.alarms.clear(ALARM_NAME);
  await chrome.storage.local.set({
    scheduledTabId: tabId || 0,
    scheduledStartAtMs: Number(startAtMs || 0)
  });

  if (tabId && startAtMs && startAtMs > Date.now()) {
    chrome.alarms.create(ALARM_NAME, { when: startAtMs });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "fast-clicker-schedule-start") {
    scheduleStart(message.tabId, message.startAtMs).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message?.type === "fast-clicker-clear-start") {
    chrome.alarms.clear(ALARM_NAME).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message?.type === "fast-clicker-workflow-status") {
    chrome.storage.local.set({
      workflowStatus: {
        tabId: sender.tab?.id || 0,
        ...message.status
      }
    }).then(() => sendResponse({ ok: true }));
    return true;
  }

  return false;
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;

  const { scheduledTabId } = await chrome.storage.local.get({ scheduledTabId: 0 });
  if (!scheduledTabId) return;

  const ready = await ensureTabReady(scheduledTabId);
  if (!ready) return;

  await chrome.tabs.sendMessage(scheduledTabId, {
    type: "fast-clicker-run-now",
    ignoreEnabled: false
  }).catch(() => {});
});
