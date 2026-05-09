import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, extname, relative } from "path";

const root = process.cwd();
const srcDir = join(root, "src");
const convexDir = join(root, "convex");

let errors = 0;
let warnings = 0;

function logError(file: string, line: number, msg: string) {
  console.error(`  ERROR  ${file}:${line} — ${msg}`);
  errors++;
}

function logWarn(file: string, line: number, msg: string) {
  console.warn(`  WARN   ${file}:${line} — ${msg}`);
  warnings++;
}

function getAllFiles(dir: string, exts: string[]): string[] {
  if (!existsSync(dir)) return [];
  const results: string[] = [];
  function walk(d: string) {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        if (
          entry === "node_modules" ||
          entry === ".next" ||
          entry === "_generated"
        )
          continue;
        walk(full);
      } else if (exts.includes(extname(entry))) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

function checkFile(filePath: string) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const rel = relative(root, filePath);

  lines.forEach((line, i) => {
    const lineNum = i + 1;
    const trimmed = line.trim();

    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("/*")
    )
      return;

    const apiKeyPatterns = [
      /sk-[a-zA-Z0-9]{20,}/,
      /sk_live_[a-zA-Z0-9]{20,}/,
      /AIza[a-zA-Z0-9_-]{35}/,
      /key-[a-zA-Z0-9]{20,}/,
    ];

    for (const pat of apiKeyPatterns) {
      if (pat.test(line)) {
        logError(rel, lineNum, "Possible hardcoded API key detected");
        break;
      }
    }

    if (/localStorage\.(setItem|getItem)/.test(line)) {
      if (
        /api[_-]?key/i.test(line) ||
        /secret/i.test(line) ||
        /credential/i.test(line) ||
        /token/i.test(line)
      ) {
        logError(
          rel,
          lineNum,
          "API key/secret stored in localStorage",
        );
      }
    }

    if (/console\.(log|info|debug|warn|error)/.test(line)) {
      if (
        /api[_-]?key/i.test(line) ||
        /secret/i.test(line) ||
        /credential/i.test(line) ||
        /password/i.test(line) ||
        /token/i.test(line)
      ) {
        logError(
          rel,
          lineNum,
          "Possible secret logged to console",
        );
      }
    }
  });

  if (
    content.includes("NEXT_PUBLIC_") &&
    (content.includes("api_key") ||
      content.includes("API_KEY") ||
      content.includes("apiKey") ||
      content.includes("secret"))
  ) {
    const hasEnvOnly =
      content.includes("process.env") && !content.includes("=");
    if (!hasEnvOnly) {
      logWarn(rel, 0, "File references NEXT_PUBLIC env with API key-like names");
    }
  }
}

console.log("\n🔒 Polis Security Checks\n");
console.log("━".repeat(50));

console.log("\n1. Checking for hardcoded API keys...");
const allTsFiles = [
  ...getAllFiles(srcDir, [".ts", ".tsx"]),
  ...getAllFiles(convexDir, [".ts"]),
];
for (const f of allTsFiles) {
  checkFile(f);
}

console.log("\n2. Checking for client-side secret exposure...");
const clientFiles = getAllFiles(join(srcDir, "components"), [".ts", ".tsx"]);
const clientPages = getAllFiles(join(srcDir, "app"), [".ts", ".tsx"]);
const clientFilesAll = [...clientFiles, ...clientPages];

for (const f of clientFilesAll) {
  const content = readFileSync(f, "utf-8");
  const rel = relative(root, f);

  if (content.includes("use client")) {
    if (content.includes("process.env")) {
      const envMatches = content.match(/process\.env\.(\w+)/g) || [];
      for (const m of envMatches) {
        const envName = m.replace("process.env.", "");
        if (!envName.startsWith("NEXT_PUBLIC_")) {
          logError(
            rel,
            0,
            `Client component accesses server env: ${envName}`,
          );
        }
      }
    }
  }
}

console.log("\n3. Checking auth patterns...");
for (const f of getAllFiles(convexDir, [".ts"])) {
  const content = readFileSync(f, "utf-8");
  const rel = relative(root, f);

  if (
    content.includes("mutation") ||
    content.includes("query")
  ) {
    if (
      !content.includes("getAuthIdentifier") &&
      !content.includes("getUserIdentity") &&
      !content.includes("providerPlaceholders") &&
      !content.includes("generateUploadUrl") &&
      !content.includes("auth.config")
    ) {
      const hasHandler = content.includes("handler:");
      const hasEmptyArgs = content.includes("args: {}");
      if (hasHandler && hasEmptyArgs) {
        const lines = content.split("\n");
        const handlerIdx = lines.findIndex((l) => l.includes("handler:"));
        const fnNames = content.match(/export const (\w+)/g) || [];
        for (const fn of fnNames) {
          const name = fn.replace("export const ", "");
          const body = content.slice(
            content.indexOf(fn),
            content.indexOf(fn) + 500,
          );
          if (
            body.includes("handler:") &&
            !body.includes("getAuthIdentifier") &&
            !body.includes("getUserIdentity")
          ) {
            logWarn(
              rel,
              handlerIdx,
              `Function "${name}" may be missing auth check`,
            );
          }
        }
      }
    }
  }
}

console.log("\n" + "━".repeat(50));
if (errors === 0 && warnings === 0) {
  console.log("✅ All security checks passed\n");
} else {
  console.log(
    `\nFound ${errors} error(s) and ${warnings} warning(s)\n`,
  );
}

process.exit(errors > 0 ? 1 : 0);
