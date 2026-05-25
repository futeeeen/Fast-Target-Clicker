import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { runWithConfig } from "../package/src/runner.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(__dirname, "public");
const port = Number(process.env.PORT || 4280);
const runs = new Map();

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(data));
}

function collectBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error("Request body too large."));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function createRun(config) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const run = {
    id,
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: "",
    events: []
  };
  runs.set(id, run);

  const onStatus = (event) => {
    run.events.push({
      at: new Date().toISOString(),
      ...event
    });
    run.lastEvent = event;
  };

  runWithConfig(config, onStatus)
    .then(() => {
      run.status = "completed";
      run.finishedAt = new Date().toISOString();
    })
    .catch((error) => {
      run.status = "failed";
      run.finishedAt = new Date().toISOString();
      run.error = error.message;
    });

  return run;
}

function parseRunId(pathname) {
  const match = pathname.match(/^\/api\/runs\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function handleApi(request, response, url) {
  if (request.method === "POST" && url.pathname === "/api/run") {
    try {
      const payload = JSON.parse(await collectBody(request));
      const workflow = typeof payload.workflowText === "string"
        ? JSON.parse(payload.workflowText)
        : payload.workflow;

      const run = createRun({
        url: payload.url,
        workflow,
        startAt: payload.startAt,
        startStep: Number(payload.startStep || 1),
        headless: Boolean(payload.headless),
        slowMo: Number(payload.slowMo || 0),
        closeOnFinish: Boolean(payload.closeOnFinish)
      });

      sendJson(response, 202, { id: run.id });
    } catch (error) {
      sendJson(response, 400, { error: error.message });
    }
    return true;
  }

  const runId = parseRunId(url.pathname);
  if (request.method === "GET" && runId) {
    const run = runs.get(runId);
    if (!run) {
      sendJson(response, 404, { error: "Run not found." });
      return true;
    }
    sendJson(response, 200, run);
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/examples") {
    const example = await readFile(join(__dirname, "../package/examples/practice-flow.json"), "utf8");
    sendJson(response, 200, { practiceFlow: example });
    return true;
  }

  return false;
}

async function serveStatic(response, pathname) {
  const safePath = normalize(pathname === "/" ? "/index.html" : pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicDir, safePath);
  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8"
  };

  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      "content-type": contentTypes[extname(filePath)] || "application/octet-stream"
    });
    response.end(content);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);

  if (url.pathname.startsWith("/api/")) {
    const handled = await handleApi(request, response, url);
    if (!handled) sendJson(response, 404, { error: "API endpoint not found." });
    return;
  }

  await serveStatic(response, url.pathname);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Playwright Runner UI: http://127.0.0.1:${port}`);
});
