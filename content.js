(() => {
if (globalThis.__fastTargetClickerLoaded) {
  globalThis.__fastTargetClickerReload?.();
  return;
}

globalThis.__fastTargetClickerLoaded = true;

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

let config = { ...DEFAULT_CONFIG };
let hasClicked = false;
let observer = null;
let pendingClickTimer = null;
let activationTimer = null;

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function isVisible(element, options = config) {
  if (!options.visibleOnly) return true;
  if (!(element instanceof HTMLElement)) return true;

  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  return (
    style.visibility !== "hidden" &&
    style.display !== "none" &&
    style.pointerEvents !== "none" &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function textMatches(element, options = config) {
  const wanted = normalize(options.text);
  if (!wanted) return true;

  const actual = normalize(element.innerText || element.textContent || element.value || "");
  return options.exactText ? actual === wanted : actual.includes(wanted);
}

function ariaMatches(element, options = config) {
  const wanted = normalize(options.ariaLabel);
  if (!wanted) return true;

  const labels = [
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.getAttribute("alt"),
    element.getAttribute("name")
  ].map(normalize);

  return labels.some((label) => label.includes(wanted));
}

function isClickableCandidate(element) {
  return isActionCandidate(element, config);
}

function isActionCandidate(element, options = config) {
  if (!(element instanceof Element)) return false;
  if (element.disabled || element.getAttribute("aria-disabled") === "true") return false;
  if (!isVisible(element, options)) return false;
  if (!textMatches(element, options)) return false;
  if (!ariaMatches(element, options)) return false;

  const tagName = element.tagName.toLowerCase();
  return (
    tagName === "button" ||
    tagName === "a" ||
    tagName === "input" ||
    element.getAttribute("role") === "button" ||
    element.onclick ||
    element.tabIndex >= 0
  );
}

function getCandidates(options = config) {
  if (options.selector?.trim()) {
    try {
      return Array.from(document.querySelectorAll(options.selector.trim()));
    } catch {
      return [];
    }
  }

  return Array.from(
    document.querySelectorAll("button, a, input[type='button'], input[type='submit'], [role='button'], [onclick]")
  );
}

function findTarget(options = config) {
  return getCandidates(options).find((element) => isActionCandidate(element, options)) || null;
}

function clickTarget(target, options = {}) {
  if (!target || (!options.ignoreClickOnce && config.clickOnce && hasClicked)) return;
  hasClicked = true;

  target.scrollIntoView({ block: "center", inline: "center" });
  target.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerId: 1 }));
  target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
  target.click();
  target.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
  target.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true, pointerId: 1 }));

  chrome.runtime.sendMessage({
    type: "fast-clicker-clicked",
    url: location.href,
    text: (target.innerText || target.textContent || target.value || "").trim().slice(0, 120)
  }).catch(() => {});
}

function isBeforeStartTime() {
  return Number(config.startAtMs || 0) > Date.now();
}

function scheduleActivationScan() {
  if (activationTimer) {
    clearTimeout(activationTimer);
    activationTimer = null;
  }

  if (!config.enabled || !isBeforeStartTime()) return;

  const startAtMs = Number(config.startAtMs);
  const waitMs = Math.min(startAtMs - Date.now() - 100, 2147483647);

  activationTimer = setTimeout(() => {
    const waitForExactTime = () => {
      if (Date.now() >= startAtMs) {
        hasClicked = false;
        scanAndClick();
        return;
      }

      requestAnimationFrame(waitForExactTime);
    };

    waitForExactTime();
  }, Math.max(0, waitMs));
}

async function scanAndClick(options = {}) {
  if (!config.enabled && !options.ignoreEnabled) {
    return { ok: false, reason: "disabled" };
  }

  if (config.workflowEnabled && config.workflowSteps.trim()) {
    return runWorkflow(options);
  }

  if (config.clickOnce && hasClicked) {
    return { ok: true, clicked: false, reason: "already-clicked" };
  }

  if (!options.force && isBeforeStartTime()) {
    scheduleActivationScan();
    return { ok: true, clicked: false, reason: "waiting-start-time" };
  }

  const target = findTarget();
  if (!target) {
    return { ok: true, clicked: false, reason: "target-not-found" };
  }

  if (pendingClickTimer) clearTimeout(pendingClickTimer);

  if (config.delayMs > 0) {
    pendingClickTimer = setTimeout(() => clickTarget(target), config.delayMs);
    return { ok: true, clicked: true, delayed: true };
  } else {
    clickTarget(target);
    return { ok: true, clicked: true };
  }
}

function parseWorkflowSteps() {
  try {
    const parsed = JSON.parse(config.workflowSteps || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function getWorkflowIndex() {
  const result = await chrome.storage.local.get({ workflowIndex: 0 });
  return Number(result.workflowIndex || 0);
}

async function setWorkflowIndex(index) {
  await chrome.storage.local.set({ workflowIndex: index });
}

function stepOptions(step) {
  return {
    selector: step.selector || "",
    text: step.text || "",
    ariaLabel: step.ariaLabel || "",
    exactText: Boolean(step.exactText),
    visibleOnly: step.visibleOnly !== false
  };
}

function findElementForStep(step) {
  if (step.selector?.trim()) {
    try {
      return Array.from(document.querySelectorAll(step.selector.trim()))
        .find((element) => isVisible(element, stepOptions(step))) || null;
    } catch {
      return null;
    }
  }

  return findTarget(stepOptions(step));
}

function setNativeValue(element, value) {
  const descriptor = Object.getOwnPropertyDescriptor(element.constructor.prototype, "value");
  if (descriptor?.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }
}

function selectOption(select, step) {
  const wanted = normalize(step.value || step.label || step.text);
  if (!wanted) return false;

  const option = Array.from(select.options).find((item) => {
    return normalize(item.value) === wanted || normalize(item.label) === wanted || normalize(item.textContent) === wanted;
  });

  if (!option) return false;

  select.value = option.value;
  select.dispatchEvent(new Event("input", { bubbles: true }));
  select.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function setCheckbox(element, checked) {
  if (!(element instanceof HTMLInputElement)) return false;
  if (element.type !== "checkbox" && element.type !== "radio") return false;

  element.checked = checked;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

async function runWorkflow(options = {}) {
  if (!options.force && isBeforeStartTime()) {
    scheduleActivationScan();
    return { ok: true, clicked: false, reason: "waiting-start-time" };
  }

  const steps = parseWorkflowSteps();
  if (!steps.length) {
    return { ok: false, clicked: false, reason: "workflow-empty" };
  }

  const index = await getWorkflowIndex();
  const step = steps[index];
  if (!step) {
    return { ok: true, clicked: false, reason: "workflow-finished", index, total: steps.length };
  }

  const type = step.type || "click";
  const element = findElementForStep(step);
  if (!element) {
    return {
      ok: true,
      clicked: false,
      reason: "step-target-not-found",
      index,
      total: steps.length,
      step
    };
  }

  if (type === "select") {
    if (!(element instanceof HTMLSelectElement)) {
      return { ok: true, clicked: false, reason: "step-target-not-select", index, total: steps.length, step };
    }
    if (!selectOption(element, step)) {
      return { ok: true, clicked: false, reason: "select-option-not-found", index, total: steps.length, step };
    }
    await setWorkflowIndex(index + 1);
    setTimeout(() => runWorkflow({ force: true }), Number(step.nextDelayMs || 50));
    return { ok: true, clicked: true, action: "select", index, nextIndex: index + 1, total: steps.length, step };
  }

  if (type === "check") {
    if (!setCheckbox(element, step.checked !== false)) {
      return { ok: true, clicked: false, reason: "step-target-not-checkbox", index, total: steps.length, step };
    }
    await setWorkflowIndex(index + 1);
    setTimeout(() => runWorkflow({ force: true }), Number(step.nextDelayMs || 50));
    return { ok: true, clicked: true, action: "check", index, nextIndex: index + 1, total: steps.length, step };
  }

  if (type === "fill") {
    if (!("value" in element)) {
      return { ok: true, clicked: false, reason: "step-target-not-fillable", index, total: steps.length, step };
    }
    setNativeValue(element, step.value || "");
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    await setWorkflowIndex(index + 1);
    setTimeout(() => runWorkflow({ force: true }), Number(step.nextDelayMs || 50));
    return { ok: true, clicked: true, action: "fill", index, nextIndex: index + 1, total: steps.length, step };
  }

  await setWorkflowIndex(index + 1);
  clickTarget(element, { ignoreClickOnce: true });
  setTimeout(() => runWorkflow({ force: true }), Number(step.nextDelayMs || 100));
  return { ok: true, clicked: true, action: "click", index, nextIndex: index + 1, total: steps.length, step };
}

function startObserver() {
  if (!document.documentElement) {
    requestAnimationFrame(startObserver);
    return;
  }

  if (observer) observer.disconnect();

  observer = new MutationObserver(scanAndClick);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style", "disabled", "aria-label", "role"]
  });

  scanAndClick();
}

function applyConfig(nextConfig) {
  config = { ...DEFAULT_CONFIG, ...nextConfig };
  hasClicked = false;
  scheduleActivationScan();
  startObserver();
}

chrome.storage.sync.get(DEFAULT_CONFIG).then(applyConfig);

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync") return;

  const nextConfig = { ...config };
  for (const [key, change] of Object.entries(changes)) {
    nextConfig[key] = change.newValue;
  }
  applyConfig(nextConfig);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "fast-clicker-ping") {
    sendResponse({ ok: true });
  }

  if (message?.type === "fast-clicker-scan") {
    scanAndClick({ force: true }).then(sendResponse);
    return true;
  }

  if (message?.type === "fast-clicker-test") {
    hasClicked = false;
    scanAndClick({ force: true, ignoreEnabled: true }).then(sendResponse);
    return true;
  }

  if (message?.type === "fast-clicker-reset") {
    hasClicked = false;
    chrome.storage.local.set({ workflowIndex: 0 });
    scanAndClick();
    sendResponse({ ok: true });
  }
});

globalThis.__fastTargetClickerReload = () => {
  chrome.storage.sync.get(DEFAULT_CONFIG).then(applyConfig);
};
})();
