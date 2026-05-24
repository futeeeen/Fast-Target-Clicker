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
  workflowSteps: "",
  workflowStartStep: 1
};

let config = { ...DEFAULT_CONFIG };
let hasClicked = false;
let observer = null;
let pendingClickTimer = null;
let activationTimer = null;
let workflowResumeTimer = null;
let memoryWorkflowIndex = 0;

const WORKFLOW_INDEX_KEY = "fastTargetClicker.workflowIndex";
const WORKFLOW_STATUS_KEY = "fastTargetClicker.workflowStatus";
const WORKFLOW_ACTIVE_KEY = "fastTargetClicker.workflowActive";
const WORKFLOW_RESUME_AT_KEY = "fastTargetClicker.workflowResumeAt";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeList(value) {
  if (!Array.isArray(value)) return [];
  return value.map(normalize).filter(Boolean);
}

function getElementText(element) {
  return normalize(element.innerText || element.textContent || element.value || "");
}

function hasTextFilter(options = config) {
  return Boolean(
    normalize(options.text) ||
    normalizeList(options.textIncludes).length ||
    getTextIncludeGroups(options).length ||
    normalizeList(options.textExcludes).length
  );
}

function getTextIncludeGroups(options = config) {
  const groups = [];

  if (normalizeList(options.textIncludes).length) {
    groups.push(normalizeList(options.textIncludes));
  }

  Object.keys(options)
    .filter((key) => /^textIncludes_\d+$/.test(key))
    .sort((a, b) => Number(a.split("_")[1]) - Number(b.split("_")[1]))
    .forEach((key) => {
      const group = normalizeList(options[key]);
      if (group.length) groups.push(group);
    });

  return groups;
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
  const includeGroups = getTextIncludeGroups(options);
  const excludes = normalizeList(options.textExcludes);

  if (!wanted && !includeGroups.length && !excludes.length) return true;

  const actual = getElementText(element);
  const textOk = !wanted || (options.exactText ? actual === wanted : actual.includes(wanted));
  const includesOk = !includeGroups.length || includeGroups.some((group) => group.every((item) => actual.includes(item)));
  const excludesOk = excludes.every((item) => !actual.includes(item));

  return textOk && includesOk && excludesOk;
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
  const hasTextFilterValue = hasTextFilter(options);

  return (
    tagName === "button" ||
    tagName === "a" ||
    tagName === "input" ||
    (hasTextFilterValue && ["div", "li", "label", "span"].includes(tagName)) ||
    element.getAttribute("role") === "button" ||
    element.onclick ||
    element.tabIndex >= 0
  );
}

function getCandidatePriority(element) {
  const tagName = element.tagName.toLowerCase();

  if (
    tagName === "button" ||
    tagName === "a" ||
    tagName === "input" ||
    element.getAttribute("role") === "button" ||
    element.onclick ||
    element.tabIndex >= 0
  ) {
    return 0;
  }

  if (tagName === "li" || tagName === "label") return 1;
  return 2;
}

function getCandidates(options = config) {
  if (options.selector?.trim()) {
    try {
      return Array.from(document.querySelectorAll(options.selector.trim()));
    } catch {
      return [];
    }
  }

  const selector = hasTextFilter(options)
    ? "button, a, li, div, label, span, input[type='button'], input[type='submit'], [role='button'], [onclick]"
    : "button, a, input[type='button'], input[type='submit'], [role='button'], [onclick]";

  return Array.from(document.querySelectorAll(selector));
}

function findTarget(options = config) {
  const matches = getCandidates(options).filter((element) => isActionCandidate(element, options));
  if (!matches.length) return null;

  if (hasTextFilter(options) && !options.selector?.trim()) {
    matches.sort((a, b) => {
      const priorityDiff = getCandidatePriority(a) - getCandidatePriority(b);
      if (priorityDiff !== 0) return priorityDiff;

      return getElementText(a).length - getElementText(b).length;
    });
  }

  return matches[0];
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
}

function getStoredNumber(key, fallback = 0) {
  try {
    return Number(sessionStorage.getItem(key) || fallback);
  } catch {
    return fallback;
  }
}

function getStoredBoolean(key) {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function setWorkflowActive(active, resumeAt = Date.now()) {
  try {
    sessionStorage.setItem(WORKFLOW_ACTIVE_KEY, active ? "1" : "0");
    sessionStorage.setItem(WORKFLOW_RESUME_AT_KEY, String(resumeAt));
  } catch {
    // Storage can be blocked on some pages; timers still work while staying on the same document.
  }
}

function isWorkflowActive() {
  return getStoredBoolean(WORKFLOW_ACTIVE_KEY);
}

function getWorkflowResumeAt() {
  return getStoredNumber(WORKFLOW_RESUME_AT_KEY, 0);
}

function scheduleWorkflowResume() {
  if (workflowResumeTimer) {
    clearTimeout(workflowResumeTimer);
    workflowResumeTimer = null;
  }

  if (!config.workflowEnabled || !config.workflowSteps.trim() || !isWorkflowActive()) return;

  const waitMs = Math.max(0, getWorkflowResumeAt() - Date.now());
  workflowResumeTimer = setTimeout(() => {
    scanAndClick({ force: true, resume: true });
  }, waitMs);
}

async function scanAndClick(options = {}) {
  if (!config.enabled && !options.ignoreEnabled) {
    return { ok: false, reason: "disabled" };
  }

  if (config.workflowEnabled && config.workflowSteps.trim()) {
    if (!options.force) {
      scheduleWorkflowResume();
      return { ok: true, clicked: false, reason: "waiting-explicit-trigger" };
    }
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

async function runNow(options = {}) {
  hasClicked = false;
  setWorkflowIndex(getStartIndex(options.startStep));
  setWorkflowActive(true, Date.now());
  return scanAndClick({
    force: true,
    ignoreEnabled: Boolean(options.ignoreEnabled)
  });
}

function getStartIndex(startStep) {
  const rawStep = Number(startStep || config.workflowStartStep || 1);
  return Math.max(0, Math.floor(rawStep) - 1);
}

function parseWorkflowSteps() {
  try {
    const parsed = JSON.parse(config.workflowSteps || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getWorkflowIndex() {
  try {
    const stored = sessionStorage.getItem(WORKFLOW_INDEX_KEY);
    memoryWorkflowIndex = Number(stored || 0);
  } catch {
    // Some pages restrict storage; keep an in-memory fallback for the current document.
  }

  return Number(memoryWorkflowIndex || 0);
}

function setWorkflowIndex(index) {
  memoryWorkflowIndex = Number(index || 0);

  try {
    sessionStorage.setItem(WORKFLOW_INDEX_KEY, String(memoryWorkflowIndex));
  } catch {
    // In-memory fallback is enough until the current page navigates.
  }
}

function queueNextWorkflowStep(nextIndex, delayMs) {
  const normalizedDelay = Math.max(0, Number(delayMs || 0));
  setWorkflowIndex(nextIndex);
  setWorkflowActive(true, Date.now() + normalizedDelay);
  scheduleWorkflowResume();
}

function describeStep(step = {}) {
  if (step.selector) return step.selector;
  const groups = getTextIncludeGroups(step);
  if (groups.length > 1) return `include groups: ${groups.map((group) => `[${group.join(", ")}]`).join(" OR ")}`;
  if (step.textIncludes?.length) return `includes: ${step.textIncludes.join(", ")}`;
  if (step.text) return step.text;
  if (step.ariaLabel) return step.ariaLabel;
  return step.value || "";
}

function setWorkflowStatus(status) {
  const nextStatus = {
    updatedAt: Date.now(),
    url: location.href,
    ...status
  };

  try {
    sessionStorage.setItem(WORKFLOW_STATUS_KEY, JSON.stringify(nextStatus));
  } catch {
    // Status is diagnostic only; execution should continue even if storage is blocked.
  }

  chrome.runtime.sendMessage({
    type: "fast-clicker-workflow-status",
    status: nextStatus
  }).catch(() => {});
}

function stepOptions(step) {
  const options = {
    selector: step.selector || "",
    text: step.text || "",
    textIncludes: Array.isArray(step.textIncludes) ? step.textIncludes : [],
    textExcludes: Array.isArray(step.textExcludes) ? step.textExcludes : [],
    ariaLabel: step.ariaLabel || "",
    exactText: Boolean(step.exactText),
    visibleOnly: step.visibleOnly !== false
  };

  Object.keys(step)
    .filter((key) => /^textIncludes_\d+$/.test(key))
    .forEach((key) => {
      options[key] = Array.isArray(step[key]) ? step[key] : [];
    });

  return options;
}

function findElementForStep(step) {
  if (step.selector?.trim()) {
    try {
      return Array.from(document.querySelectorAll(step.selector.trim()))
        .find((element) => {
          const options = stepOptions(step);
          return isVisible(element, options) && textMatches(element, options) && ariaMatches(element, options);
        }) || null;
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
    const result = { ok: true, clicked: false, reason: "waiting-start-time" };
    setWorkflowStatus({ state: "waiting", reason: result.reason });
    return result;
  }

  const steps = parseWorkflowSteps();
  if (!steps.length) {
    const result = { ok: false, clicked: false, reason: "workflow-empty" };
    setWorkflowActive(false);
    setWorkflowStatus({ state: "error", reason: result.reason });
    return result;
  }

  const index = getWorkflowIndex();
  const step = steps[index];
  if (!step) {
    const result = { ok: true, clicked: false, reason: "workflow-finished", index, total: steps.length };
    setWorkflowActive(false);
    setWorkflowStatus({ state: "finished", index, total: steps.length, reason: result.reason });
    return result;
  }

  const type = step.type || "click";
  setWorkflowStatus({
    state: "running",
    index,
    total: steps.length,
    action: type,
    target: describeStep(step),
    step
  });

  const element = findElementForStep(step);
  if (!element) {
    const result = {
      ok: true,
      clicked: false,
      reason: "step-target-not-found",
      index,
      total: steps.length,
      step
    };
    setWorkflowActive(false);
    setWorkflowStatus({
      state: "blocked",
      index,
      total: steps.length,
      action: type,
      target: describeStep(step),
      reason: result.reason,
      step
    });
    return result;
  }

  if (type === "select") {
    if (!(element instanceof HTMLSelectElement)) {
      const result = { ok: true, clicked: false, reason: "step-target-not-select", index, total: steps.length, step };
      setWorkflowActive(false);
      setWorkflowStatus({ state: "blocked", index, total: steps.length, action: type, target: describeStep(step), reason: result.reason, step });
      return result;
    }
    if (!selectOption(element, step)) {
      const result = { ok: true, clicked: false, reason: "select-option-not-found", index, total: steps.length, step };
      setWorkflowActive(false);
      setWorkflowStatus({ state: "blocked", index, total: steps.length, action: type, target: describeStep(step), reason: result.reason, step });
      return result;
    }
    queueNextWorkflowStep(index + 1, step.nextDelayMs || 50);
    const result = { ok: true, clicked: true, action: "select", index, nextIndex: index + 1, total: steps.length, step };
    setWorkflowStatus({ state: "done", index, nextIndex: index + 1, total: steps.length, action: type, target: describeStep(step), step });
    return result;
  }

  if (type === "check") {
    if (!setCheckbox(element, step.checked !== false)) {
      const result = { ok: true, clicked: false, reason: "step-target-not-checkbox", index, total: steps.length, step };
      setWorkflowActive(false);
      setWorkflowStatus({ state: "blocked", index, total: steps.length, action: type, target: describeStep(step), reason: result.reason, step });
      return result;
    }
    queueNextWorkflowStep(index + 1, step.nextDelayMs || 50);
    const result = { ok: true, clicked: true, action: "check", index, nextIndex: index + 1, total: steps.length, step };
    setWorkflowStatus({ state: "done", index, nextIndex: index + 1, total: steps.length, action: type, target: describeStep(step), step });
    return result;
  }

  if (type === "fill") {
    if (!("value" in element)) {
      const result = { ok: true, clicked: false, reason: "step-target-not-fillable", index, total: steps.length, step };
      setWorkflowActive(false);
      setWorkflowStatus({ state: "blocked", index, total: steps.length, action: type, target: describeStep(step), reason: result.reason, step });
      return result;
    }
    setNativeValue(element, step.value || "");
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    queueNextWorkflowStep(index + 1, step.nextDelayMs || 50);
    const result = { ok: true, clicked: true, action: "fill", index, nextIndex: index + 1, total: steps.length, step };
    setWorkflowStatus({ state: "done", index, nextIndex: index + 1, total: steps.length, action: type, target: describeStep(step), step });
    return result;
  }

  queueNextWorkflowStep(index + 1, step.nextDelayMs || 100);
  clickTarget(element, { ignoreClickOnce: true });
  const result = { ok: true, clicked: true, action: "click", index, nextIndex: index + 1, total: steps.length, step };
  setWorkflowStatus({ state: "done", index, nextIndex: index + 1, total: steps.length, action: type, target: describeStep(step), step });
  return result;
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
  scheduleWorkflowResume();
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

  if (message?.type === "fast-clicker-run-now") {
    runNow({
      ignoreEnabled: Boolean(message.ignoreEnabled),
      startStep: message.startStep
    }).then(sendResponse);
    return true;
  }

  if (message?.type === "fast-clicker-test") {
    runNow({ ignoreEnabled: true }).then(sendResponse);
    return true;
  }

  if (message?.type === "fast-clicker-reset") {
    hasClicked = false;
    setWorkflowIndex(getStartIndex(message.startStep));
    setWorkflowActive(false);
    setWorkflowStatus({
      state: "reset",
      index: getWorkflowIndex(),
      reason: "workflow-reset"
    });
    sendResponse({ ok: true, reset: true, index: getWorkflowIndex() });
  }
});

globalThis.__fastTargetClickerReload = () => {
  chrome.storage.sync.get(DEFAULT_CONFIG).then(applyConfig);
};
})();
