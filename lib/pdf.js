import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
];

export function findChrome() {
  const fromEnv = process.env.CHROME_PATH;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
  const hit = CANDIDATES.find((p) => fs.existsSync(p));
  if (!hit) {
    throw new Error(
      "No Chrome-family browser found. Install Google Chrome, or set CHROME_PATH to a browser binary."
    );
  }
  return hit;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sizeOf = (p) => (fs.existsSync(p) ? fs.statSync(p).size : -1);

/**
 * Renders an HTML string to a PDF with headless Chrome.
 *
 * Chrome writes the PDF and then frequently fails to exit, so rather than
 * waiting on the process we watch the output file and kill Chrome once the
 * file has stopped growing.
 */
export async function htmlToPdf(html, outPath, { timeoutMs = 45000 } = {}) {
  const chrome = findChrome();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "poly-invoice-"));
  const htmlPath = path.join(tmpDir, "invoice.html");
  fs.writeFileSync(htmlPath, html);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.rmSync(outPath, { force: true });

  const child = spawn(
    chrome,
    [
      "--headless",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-sync",
      "--disable-crash-reporter",
      `--user-data-dir=${path.join(tmpDir, "profile")}`,
      "--virtual-time-budget=5000",
      "--no-pdf-header-footer",
      `--print-to-pdf=${outPath}`,
      `file://${htmlPath}`,
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  );

  let stderr = "";
  child.stderr.on("data", (d) => (stderr += d.toString()));

  let exited = false;
  child.on("exit", () => (exited = true));

  const started = Date.now();
  let lastSize = -1;

  try {
    while (Date.now() - started < timeoutMs) {
      await sleep(150);
      const size = sizeOf(outPath);

      // Written and stable across two polls: Chrome is done, even if it lingers.
      if (size > 0 && size === lastSize) return outPath;
      lastSize = size;

      if (exited) break;
    }
  } finally {
    if (!exited) {
      child.kill("SIGKILL");
      await sleep(50);
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  if (sizeOf(outPath) > 0) return outPath;
  throw new Error(`Chrome did not produce a PDF.\n${stderr.trim().split("\n").slice(-5).join("\n")}`);
}

/** Counts pages in a PDF without parsing it properly. Good enough for a layout guard. */
export function pageCount(pdfPath) {
  const bytes = fs.readFileSync(pdfPath);
  const matches = bytes.toString("latin1").match(/\/Type\s*\/Page[^s]/g);
  return matches ? matches.length : 1;
}
