#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const repoRoot = process.cwd();
const srcRoot = join(repoRoot, "src");

const allowedProcessEnvFiles = new Set([
  "src/server/config/env.ts",
  "src/lib/polling.ts",
  "src/server/db/client.ts"
]);

const allowedRawSqlFiles = new Set([
  "src/app/api/health/route.ts"
]);

const sourceExtensions = new Set([".ts", ".tsx"]);

function isTestFile(path) {
  return path.endsWith(".test.ts") || path.endsWith(".test.tsx");
}

function walk(dir) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(dir, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      files.push(...walk(absolutePath));
      continue;
    }

    files.push(absolutePath);
  }

  return files;
}

function fileHasPattern(content, pattern) {
  return pattern.test(content);
}

function main() {
  const allFiles = walk(srcRoot);
  const violations = [];

  for (const absoluteFilePath of allFiles) {
    const relativePath = relative(repoRoot, absoluteFilePath).replaceAll("\\", "/");
    const extension = relativePath.slice(relativePath.lastIndexOf("."));

    if (!sourceExtensions.has(extension) || isTestFile(relativePath)) {
      continue;
    }

    const content = readFileSync(absoluteFilePath, "utf8");

    if (fileHasPattern(content, /process\.env\b/g) && !allowedProcessEnvFiles.has(relativePath)) {
      violations.push(
        `${relativePath}: direct process.env usage is restricted. Use src/server/config/env.ts or a shared config helper.`
      );
    }

    if (fileHasPattern(content, /\$(queryRaw|queryRawUnsafe|executeRaw|executeRawUnsafe)\b/g) && !allowedRawSqlFiles.has(relativePath)) {
      violations.push(
        `${relativePath}: raw SQL usage is restricted. Prefer Prisma model operations or isolate unavoidable probes.`
      );
    }
  }

  if (violations.length > 0) {
    console.error("Portability guardrail check failed:\n");

    for (const violation of violations) {
      console.error(`- ${violation}`);
    }

    process.exit(1);
  }

  console.log("Portability guardrail check passed.");
}

main();
