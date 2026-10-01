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

export const rates = () => readJson(path.join(root, "data", "rates.json"));

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

/** Prices an ad off the rate card: area in square inches × the category's rate. */
function rateCardLines(ad, card = rates()) {
  const size = card.sizes[ad.size];
  if (!size) throw new Error(`Unknown ad size "${ad.size}". Known: ${Object.keys(card.sizes).join(", ")}`);
  const cat = card.categories[ad.category];
  if (!cat) throw new Error(`Unknown rate category "${ad.category}". Known: ${Object.keys(card.categories).join(", ")}`);

  const height = ad.height ?? size.height;
  const width = ad.width ?? size.width;
  const area = height * width;
  return {
    name: `${cat.name} ${size.name}`,
    dimensions: `${height} \u00d7 ${width} in`,
    lines: [
      {
        detail: `${cat.name} square inch`,
        rateFmt: money(cat.perSqIn),
        qtyFmt: String(area),
        amount: Math.round(area * cat.perSqIn * 100) / 100,
      },
    ],
  };
}

/** Turns a raw invoice JSON into everything the template needs. */
export function buildModel(inv, cfg = config(), book = clients()) {
  const client = resolveClient(inv, book);
  const termsDays = inv.termsDays ?? cfg.defaultTermsDays ?? 30;
  const dueIso = inv.dueDate ?? addDays(inv.date, termsDays);

  // One invoice bills one ad. Its lines are aspects of that ad (size, position,
  // colour, a discount…), each contributing to the price.
  if (!inv.ad) throw new Error(`Invoice ${inv.number} has no "ad" — see README, "An invoice file"`);
  const priced = inv.ad.size ? rateCardLines(inv.ad) : { name: "", dimensions: "", lines: [] };
  const lines = [...priced.lines, ...(inv.ad.lines ?? [])].map((l) => {
    const amount = l.amount ?? 0;
    return { ...l, amount, amountFmt: amount === 0 ? "Included" : money(amount) };
  });

  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
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
    ad: { name: inv.ad.name ?? priced.name, dimensions: priced.dimensions, run: inv.ad.run ?? "", lines },
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
