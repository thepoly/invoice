#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { root, config, clients, buildModel, readJson, money, addDays } from "../lib/build.js";
import { renderHtml } from "../lib/template.js";
import { htmlToPdf, pageCount } from "../lib/pdf.js";

const INV_DIR = path.join(root, "data", "invoices");
const OUT_DIR = path.join(root, "out");

const listInvoiceFiles = () =>
  fs.existsSync(INV_DIR)
    ? fs.readdirSync(INV_DIR).filter((f) => f.endsWith(".json")).sort().map((f) => path.join(INV_DIR, f))
    : [];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const outPathFor = (model) =>
  path.join(OUT_DIR, `Poly-Invoice-${model.number}-${slug(model.clientName)}.pdf`);

function resolveInvoiceArg(arg) {
  if (!arg) return null;
  if (fs.existsSync(arg)) return arg;
  const byNumber = path.join(INV_DIR, `${arg}.json`);
  if (fs.existsSync(byNumber)) return byNumber;
  return null;
}

// ── render ────────────────────────────────────────────────

async function render(args) {
  const htmlOnly = args.includes("--html");
  const open = args.includes("--open");
  const targets = args.includes("--all")
    ? listInvoiceFiles()
    : args.filter((a) => !a.startsWith("--")).map((a) => {
        const p = resolveInvoiceArg(a);
        if (!p) throw new Error(`No invoice found for "${a}" (looked in data/invoices/)`);
        return p;
      });

  if (targets.length === 0) throw new Error("Nothing to render. Pass an invoice number, a path, or --all.");

  for (const file of targets) {
    const model = buildModel(readJson(file));
    const html = renderHtml(model);

    if (htmlOnly) {
      const out = outPathFor(model).replace(/\.pdf$/, ".html");
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, html);
      console.log(`  ${path.relative(root, out)}`);
      if (open) execFileSync("open", [out]);
      continue;
    }

    const out = outPathFor(model);
    await htmlToPdf(html, out);
    // Everything fits on a single page: invoice, then the remittance slip.
    const pages = pageCount(out);
    const expected = 1;
    console.log(`  ${path.relative(root, out)}  ${model.total}  →  ${model.clientName}`);
    if (pages > expected) {
      console.log(
        `  ⚠ ${pages} pages, expected ${expected}. The page has spilled over — shorten the notes or a placement description.`
      );
    }
    if (open) execFileSync("open", [out]);
  }
}

// ── new ───────────────────────────────────────────────────

function nextNumber() {
  const nums = listInvoiceFiles()
    .map((f) => parseInt(path.basename(f, ".json"), 10))
    .filter((n) => Number.isFinite(n));
  return nums.length ? Math.max(...nums) + 1 : 1001;
}

function newInvoice(args) {
  const clientKey = args.find((a) => !a.startsWith("--"));
  if (!clientKey) throw new Error('Usage: invoice new <client-key>   (keys live in data/clients.json)');
  const book = clients();
  if (!book[clientKey]) {
    throw new Error(
      `Unknown client "${clientKey}". Known: ${Object.keys(book).join(", ") || "(none yet)"}\n` +
        `Add it to data/clients.json first.`
    );
  }

  const number = nextNumber();
  const today = new Date().toISOString().slice(0, 10);
  const stub = {
    number: String(number),
    date: today,
    client: clientKey,
    items: [{ description: "Full page", detail: "Vol. — No. — · —", qty: 1, rate: 0 }],
    notes: config().defaultNotes ?? "",
    paid: null,
  };

  const file = path.join(INV_DIR, `${number}.json`);
  fs.mkdirSync(INV_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(stub, null, 2) + "\n");
  console.log(`  ${path.relative(root, file)}   (fill in items, then: node bin/invoice.js render ${number})`);
}

// ── paid ──────────────────────────────────────────────────

function markPaid(args) {
  const [numArg] = args.filter((a) => !a.startsWith("--"));
  const file = resolveInvoiceArg(numArg);
  if (!file) throw new Error(`Usage: invoice paid <number> [--check 8871] [--date 2026-10-02]`);

  const flag = (name, fallback) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
  };

  const inv = readJson(file);
  inv.paid = {
    date: flag("date", new Date().toISOString().slice(0, 10)),
    check: flag("check", ""),
    method: "check",
  };
  fs.writeFileSync(file, JSON.stringify(inv, null, 2) + "\n");
  const model = buildModel(inv);
  console.log(`  Invoice ${model.number} marked paid ${inv.paid.date}${inv.paid.check ? ` (check #${inv.paid.check})` : ""} — ${model.total}`);
}

// ── list (the ledger) ─────────────────────────────────────

function list(args) {
  const showAll = args.includes("--all");
  const today = new Date().toISOString().slice(0, 10);
  const rows = listInvoiceFiles().map((f) => buildModel(readJson(f)));
  const shown = showAll ? rows : rows.filter((r) => !r.paid);

  if (shown.length === 0) {
    console.log(showAll ? "  No invoices yet." : "  Nothing outstanding.");
    return;
  }

  const pad = (s, n) => String(s).padEnd(n);
  const padL = (s, n) => String(s).padStart(n);
  console.log("");
  console.log(`  ${pad("INV", 7)}${pad("CLIENT", 30)}${pad("ISSUED", 13)}${pad("DUE", 13)}${padL("AMOUNT", 11)}   STATUS`);
  console.log(`  ${"─".repeat(85)}`);

  let outstanding = 0;
  for (const r of shown) {
    let status;
    if (r.paid) {
      status = `paid ${r.paid.date}${r.paid.check ? ` · #${r.paid.check}` : ""}`;
    } else if (r.dueIso < today) {
      const days = Math.round((Date.parse(today) - Date.parse(r.dueIso)) / 86400000);
      status = `OVERDUE ${days}d`;
      outstanding += r.totalRaw;
    } else {
      status = "outstanding";
      outstanding += r.totalRaw;
    }
    console.log(
      `  ${pad(r.number, 7)}${pad(r.clientName.slice(0, 28), 30)}${pad(r.dateIso, 13)}${pad(r.dueIso, 13)}${padL(r.total, 11)}   ${status}`
    );
  }
  console.log(`  ${"─".repeat(85)}`);
  console.log(`  ${padL(`Outstanding: ${money(outstanding)}`, 85)}`);
  console.log("");
}

// ── main ──────────────────────────────────────────────────

const HELP = `
  The Polytechnic — advertising invoices

    node bin/invoice.js new <client-key>        scaffold data/invoices/<n>.json
    node bin/invoice.js render <n|path|--all>   write the PDF into out/
    node bin/invoice.js render <n> --html       write HTML instead (fast design preview)
    node bin/invoice.js render <n> --open       open the result when it's done
    node bin/invoice.js paid <n> --check 8871   record a check against an invoice
    node bin/invoice.js list [--all]            who still owes you money

  Clients live in data/clients.json. Your own details live in config.json.
`;

const [cmd, ...args] = process.argv.slice(2);

try {
  switch (cmd) {
    case "render": await render(args); break;
    case "new": newInvoice(args); break;
    case "paid": markPaid(args); break;
    case "list": case "ledger": list(args); break;
    default: console.log(HELP);
  }
} catch (err) {
  console.error(`\n  ${err.message}\n`);
  process.exit(1);
}
