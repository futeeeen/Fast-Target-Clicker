#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const DEFAULT_WAIT_FOR_MS = 10000;
const DEFAULT_POLL_MS = 500;

function parseArgs(argv) {
  const args = {
    headless: false,
    startStep: 1
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--headless") {
      args.headless = true;
    } else if (arg === "--url") {
      args.url = next;
      index += 1;
    } else if (arg === "--workflow") {
      args.workflowPath = next;
      index += 1;
    } else if (arg === "--config") {
      args.configPath = next;
      index += 1;
    } else if (arg === "--start-at") {
      args.startAt = next;
      index += 1;
    } else if (arg === "--start-step") {
      args.startStep = Number(next || 1);
      index += 1;
    } else if (arg === "--slow-mo") {
      args.slowMo = Number(next || 0);
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`
Fast Target Clicker Playwright Runner

Usage:
  npm start -- --url <url> --workflow <workflow.json>
  npm start -- --config <config.json>

Options:
  --url <url>              Page URL to open before running.
  --workflow <file>        JSON workflow array file.
  --config <file>          JSON config object with url/workflow/startAt/startStep.
  --start-at <datetime>    Delay execution until local time, for example "2026-05-25 14:30:00".
  --start-step <number>    Start from a 1-based workflow step.
  --headless               Run without showing the browser.
  --slow-mo <ms>           Slow Playwright actions down for debugging.
`);
}

async function readJson(path) {
  const text = await readFile(path, "utf8");
  return JSON.parse(text);
}

async function loadConfig(args) {
  let config = {};

  if (args.configPath) {
    config = await readJson(args.configPath);
  }

  let workflow = config.workflow || [];
  if (args.workflowPath) {
    workflow = await readJson(args.workflowPath);
  } else if (config.workflowPath) {
    workflow = await readJson(config.workflowPath);
  }

  if (!Array.isArray(workflow) || workflow.length === 0) {
    throw new Error("Workflow is empty. Provide a JSON array with at least one step.");
  }

  return {
    url: args.url || config.url,
    workflow,
    startAt: args.startAt || config.startAt,
    startStep: Number(args.startStep || config.startStep || 1),
    headless: Boolean(args.headless || config.headless),
    slowMo: Number(args.slowMo ?? config.slowMo ?? 0)
  };
}

function parseStartAt(value) {
  if (!value) return 0;

  const normalized = String(value).trim().replace(" ", "T");
  const timestamp = Date.parse(normalized);
  if (Number.isNaN(timestamp)) {
    throw new Error(`Invalid --start-at value: ${value}`);
  }

  return timestamp;
}

async function waitUntil(timestamp) {
  const remaining = timestamp - Date.now();
  if (remaining <= 0) return;

  console.log(`Waiting ${remaining}ms until scheduled start...`);
  await new Promise((resolve) => setTimeout(resolve, remaining));
}

function stepLabel(step) {
  if (step.selector) return step.selector;
  if (step.text) return `text=${step.text}`;
  if (step.ariaLabel) return `aria=${step.ariaLabel}`;
  if (step.textIncludes) return `textIncludes=${step.textIncludes.join(" + ")}`;
  return step.type || "unknown";
}

function normalizeArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function getIncludeGroups(step) {
  const groups = [];

  if (step.textIncludes) {
    groups.push(normalizeArray(step.textIncludes));
  }

  Object.keys(step)
    .filter((key) => /^textIncludes_\d+$/.test(key))
    .sort((a, b) => Number(a.split("_")[1]) - Number(b.split("_")[1]))
    .forEach((key) => groups.push(normalizeArray(step[key])));

  return groups.filter((group) => group.length > 0);
}

async function isCandidateMatch(locator, step) {
  const text = ((await locator.innerText({ timeout: 500 }).catch(() => "")) || "").trim();
  const includesGroups = getIncludeGroups(step);
  const excludes = normalizeArray(step.textExcludes);

  if (step.text && text !== step.text) {
    return false;
  }

  if (step.textContains && !text.includes(step.textContains)) {
    return false;
  }

  if (includesGroups.length > 0) {
    const hasGroup = includesGroups.some((group) => group.every((word) => text.includes(word)));
    if (!hasGroup) return false;
  }

  if (excludes.some((word) => text.includes(word))) {
    return false;
  }

  return true;
}

async function findTarget(page, step) {
  let locator;

  if (step.selector) {
    locator = page.locator(step.selector);
  } else if (step.text) {
    locator = page.getByText(step.text, { exact: true });
  } else if (step.ariaLabel) {
    locator = page.locator(`[aria-label="${String(step.ariaLabel).replaceAll('"', '\\"')}"], [title="${String(step.ariaLabel).replaceAll('"', '\\"')}"], [name="${String(step.ariaLabel).replaceAll('"', '\\"')}"]`);
  } else {
    locator = page.locator("button, a, input, select, textarea, [role='button'], li, div, span");
  }

  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (!(await candidate.isVisible().catch(() => false))) continue;
    if (await isCandidateMatch(candidate, step)) {
      return candidate;
    }
  }

  return null;
}

async function waitForTarget(page, step) {
  const waitForMs = Number(step.waitForMs ?? DEFAULT_WAIT_FOR_MS);
  const pollMs = Number(step.pollMs ?? DEFAULT_POLL_MS);
  const deadline = Date.now() + waitForMs;

  while (Date.now() <= deadline) {
    const target = await findTarget(page, step);
    if (target) return target;
    await page.waitForTimeout(pollMs);
  }

  return null;
}

async function runStep(page, step, index, total) {
  console.log(`Step ${index + 1}/${total}: ${step.type} ${stepLabel(step)}`);

  const target = await waitForTarget(page, step);
  if (!target) {
    throw new Error(`step-target-not-found at step ${index + 1}: ${stepLabel(step)}`);
  }

  if (step.type === "click") {
    await target.click({ timeout: Number(step.actionTimeoutMs || 5000) });
  } else if (step.type === "select") {
    await target.selectOption(String(step.value ?? ""));
  } else if (step.type === "check") {
    await target.setChecked(true);
  } else if (step.type === "fill") {
    await target.fill(String(step.value ?? ""));
  } else {
    throw new Error(`Unsupported step type: ${step.type}`);
  }

  if (step.nextDelayMs) {
    await page.waitForTimeout(Number(step.nextDelayMs));
  }
}

async function runWorkflow(page, workflow, startStep) {
  const startIndex = Math.max(0, Number(startStep || 1) - 1);

  for (let index = startIndex; index < workflow.length; index += 1) {
    await runStep(page, workflow[index], index, workflow.length);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const config = await loadConfig(args);
  if (!config.url) {
    throw new Error("Missing URL. Provide --url or config.url.");
  }

  await waitUntil(parseStartAt(config.startAt));

  const browser = await chromium.launch({
    headless: config.headless,
    slowMo: config.slowMo
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(config.url, { waitUntil: "domcontentloaded" });
    await runWorkflow(page, config.workflow, config.startStep);
    console.log("Workflow completed.");
  } finally {
    if (config.headless) {
      await browser.close();
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
