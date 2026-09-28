import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

export const config = () => readJson(path.join(root, "config.json"));
export const clients = () => {
  const p = path.join(root, "data", "clients.json");
  return fs.existsSync(p) ? readJson(p) : {};
};

const money = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const longDate = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const shortDate = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export const addDays = (iso, days) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export function resolveClient(inv, book) {
  const c = typeof inv.client === "string" ? book[inv.client] : inv.client;
  if (!c) throw new Error(`Unknown client "${inv.client}" — add it to data/clients.json`);
  return c;
}

/** Turns a raw invoice JSON into everything the template needs. */
export function buildModel(inv, cfg = config(), book = clients()) {
  const client = resolveClient(inv, book);
  const termsDays = inv.termsDays ?? cfg.defaultTermsDays ?? 30;
  const dueIso = inv.dueDate ?? addDays(inv.date, termsDays);

  const items = (inv.items ?? []).map((it) => {
    const qty = it.qty ?? 1;
    const amount = it.amount ?? qty * it.rate;
    return {
      ...it,
      qty,
      amount,
      rateFmt: money(it.rate ?? amount / qty),
      amountFmt: money(amount),
    };
  });

  const subtotal = items.reduce((s, it) => s + it.amount, 0);
  const taxRate = inv.taxRate ?? cfg.taxRate ?? 0;
  const tax = Math.round(subtotal * taxRate * 100) / 100;

  const number = `${cfg.invoiceNumberPrefix ?? ""}${inv.number}`;

  return {
    number,
    checkMemo: (cfg.checkMemoTemplate ?? "Invoice {number}").replace("{number}", number),
    dateIso: inv.date,
    dueIso,
    dateLong: longDate(inv.date),
    dueLong: shortDate(dueIso),
    termsLabel: termsDays === 0 ? "Due on receipt" : `Net ${termsDays}`,
    clientName: client.name,
    dek: inv.dek ?? "",
    billTo: {
      name: client.name,
      attn: client.attn ?? "",
      email: client.email ?? "",
      lines: client.address ?? [],
    },
    items,
    subtotal: money(subtotal),
    taxLine: tax > 0 ? { label: `${cfg.taxLabel} (${(taxRate * 100).toFixed(3).replace(/\.?0+$/, "")}%)`, value: money(tax) } : null,
    total: money(subtotal + tax),
    totalRaw: subtotal + tax,
    notes: inv.notes ?? "",
    paid: inv.paid ?? null,
    paidLong: inv.paid?.date ? shortDate(inv.paid.date) : "",
    config: cfg,
  };
}

export { money, longDate, shortDate };
