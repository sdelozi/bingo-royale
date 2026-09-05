#!/usr/bin/env node

function parseArgs(argv) {
  const args = {
    label: "target",
    url: ""
  };

  for (let index = 2; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === "--label") {
      args.label = argv[index + 1] ?? args.label;
      index += 1;
      continue;
    }

    if (current === "--url") {
      args.url = argv[index + 1] ?? "";
      index += 1;
      continue;
    }
  }

  return args;
}

async function expectJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();

  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  return {
    response,
    body
  };
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.url) {
    throw new Error("Missing required --url argument.");
  }

  const baseUrl = args.url.replace(/\/$/, "");

  console.log(`[${args.label}] Probing ${baseUrl}`);

  const health = await expectJson(`${baseUrl}/api/health`);
  if (health.response.status !== 200 || health.body?.status !== "ok") {
    throw new Error(`[${args.label}] Health probe failed: status=${health.response.status}`);
  }

  const metrics = await expectJson(`${baseUrl}/api/metrics`);
  if (metrics.response.status !== 200 || metrics.body?.status !== "ok") {
    throw new Error(`[${args.label}] Metrics probe failed: status=${metrics.response.status}`);
  }

  const authCheck = await fetch(`${baseUrl}/groups`, {
    redirect: "manual"
  });

  const validStatuses = new Set([200, 302, 303, 307, 308]);
  if (!validStatuses.has(authCheck.status)) {
    throw new Error(`[${args.label}] Protected route probe failed: status=${authCheck.status}`);
  }

  console.log(`[${args.label}] Smoke probes passed.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
