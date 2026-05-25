const ALARM_NAME = "fast-target-clicker-start";

async function enableSidePanelAction() {
  if (!chrome.sidePanel?.setPanelBehavior) return;

  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch {
    // Older Chromium builds may expose sidePanel partially; keep the extension usable.
  }
}

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

async function scheduleStart(tabId, startAtMs, startStep) {
  await chrome.alarms.clear(ALARM_NAME);
  await chrome.storage.local.set({
    scheduledTabId: tabId || 0,
    scheduledStartAtMs: Number(startAtMs || 0),
    scheduledStartStep: Math.max(1, Math.floor(Number(startStep || 1)))
  });

  if (tabId && startAtMs && startAtMs > Date.now()) {
    chrome.alarms.create(ALARM_NAME, { when: startAtMs });
  }
}

enableSidePanelAction();

chrome.runtime.onInstalled.addListener(() => {
  enableSidePanelAction();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "fast-clicker-schedule-start") {
    scheduleStart(message.tabId, message.startAtMs, message.startStep).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message?.type === "fast-clicker-clear-start") {
    Promise.all([
      chrome.alarms.clear(ALARM_NAME),
      chrome.storage.local.set({
        scheduledTabId: 0,
        scheduledStartAtMs: 0,
        scheduledStartStep: 1
      })
    ]).then(() => sendResponse({ ok: true }));
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

  const { scheduledTabId, scheduledStartStep } = await chrome.storage.local.get({
    scheduledTabId: 0,
    scheduledStartStep: 1
  });
  if (!scheduledTabId) return;

  const ready = await ensureTabReady(scheduledTabId);
  if (!ready) return;

  await chrome.tabs.sendMessage(scheduledTabId, {
    type: "fast-clicker-run-now",
    ignoreEnabled: true,
    startStep: scheduledStartStep
  }).catch(() => {});

  await chrome.storage.local.set({
    scheduledTabId: 0,
    scheduledStartAtMs: 0,
    scheduledStartStep: 1
  });
});
