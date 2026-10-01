import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const dataUri = (file, mime) =>
  `data:${mime};base64,${fs.readFileSync(path.join(root, "assets", file)).toString("base64")}`;

const fonts = () => `
@font-face {
  font-family: "Raleway";
  src: url("${dataUri("fonts/Raleway-Variable.ttf", "font/ttf")}") format("truetype");
  font-weight: 300 700;
  font-style: normal;
}
@font-face {
  font-family: "Minion Pro";
  src: url("${dataUri("fonts/MinionPro-Regular.otf", "font/otf")}") format("opentype");
  font-weight: 400;
  font-style: normal;
}
@font-face {
  font-family: "Minion Pro";
  src: url("${dataUri("fonts/MinionPro-It.otf", "font/otf")}") format("opentype");
  font-weight: 400;
  font-style: italic;
}`;

const logo = () => fs.readFileSync(path.join(root, "assets", "logo.svg"), "utf8");

const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const css = `
${fonts()}

:root {
  --ink: #000000;
  --muted: #555555;
  --rule: #bbbbbb;
}

@page {
  size: letter;
  /* Margins live on <body> instead, so the tear line can bleed to the sheet edge.
     This only works while the invoice stays on one page; render warns if it grows. */
  margin: 0;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  padding: 0.62in 0.75in 0.55in;
  font-family: "Raleway", "Helvetica Neue", Arial, sans-serif;
  font-size: 9.5pt;
  line-height: 1.38;
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
  font-variant-numeric: tabular-nums;
}

/* ── Masthead ─────────────────────────────────────────── */

.masthead svg { display: block; width: 3.35in; height: auto; }

.metaband {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 11pt;
  font-size: 8.5pt;
}
/* Equal-weight flanks so the date lands on the true centre of the page. */
.metaband .left,
.metaband .right { flex: 1 1 0; }
.metaband .mid { flex: 0 0 auto; white-space: nowrap; }
.metaband .right { text-align: right; }

/* ── Title block ──────────────────────────────────────── */

.kicker {
  margin-top: 16pt;
  color: var(--ink);
  font-size: 8.5pt;
  font-weight: 700;
}

h1 {
  font-family: "Minion Pro", Georgia, serif;
  font-size: 25pt;
  font-weight: 400;
  line-height: 1.08;
  margin-top: 4pt;
}

.dek {
  margin-top: 6pt;
  font-size: 9.5pt;
  font-weight: 400;
  color: var(--ink);
  max-width: 4.6in;
}

/* ── Parties ──────────────────────────────────────────── */

.party { margin-top: 16pt; }

.label {
  font-size: 8.5pt;
  color: var(--ink);
  margin-bottom: 3pt;
}

.party .who { font-weight: 700; font-size: 10pt; }
.party .line { color: var(--ink); line-height: 1.32; }
.party .line.subtle { color: var(--ink); }

/* ── Line items ───────────────────────────────────────── */

.ad { margin-top: 18pt; }
.ad .who { font-weight: 700; font-size: 10pt; }
.ad .line { color: var(--ink); }

table { width: 100%; border-collapse: collapse; margin-top: 10pt; }

thead th {
  font-size: 8.5pt;
  font-weight: 400;
  text-align: left;
  padding-bottom: 5pt;
  border-bottom: 0.6pt solid var(--ink);
}
th.num, td.num { text-align: right; white-space: nowrap; }
th.qty, td.qty { width: 1.0in; }
th.rate, td.rate { width: 1.0in; }
th.amount, td.amount { width: 1.1in; }

tbody tr { break-inside: avoid; }
tbody td { padding: 6pt 0 0; vertical-align: baseline; }
tbody tr:last-child td { padding-bottom: 6pt; }

/* ── Totals ───────────────────────────────────────────── */

.totals { margin-left: auto; width: 2.9in; }

.totals .row {
  display: flex;
  justify-content: space-between;
  padding: 3.5pt 0;
  font-size: 9.5pt;
  color: var(--ink);
}
.totals .row .v { color: var(--ink); }

.totals .due {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 6pt;
  padding-top: 8pt;
  border-top: 0.9pt solid var(--ink);
}
.totals .due .k { font-weight: 700; }
.totals .due .v { font-size: 16pt; font-weight: 700; }

.totals .settled {
  margin-top: 5pt;
  text-align: right;
  font-size: 8pt;
  color: var(--ink);
}

/* ── Payment ──────────────────────────────────────────── */

.payment { margin-top: 14pt; }
.payment .payee { font-weight: 700; font-size: 11pt; }
.payment .line { color: var(--ink); line-height: 1.32; }
.payment .memo { margin-top: 6pt; font-size: 8.5pt; color: var(--ink); max-width: 5.4in; }
.payment .memo strong { font-weight: 700; color: var(--ink); }


.stub { margin-top: 14pt; }

/* The tear line runs the full width of the sheet, out through both page margins. */
.tear {
  position: relative;
  margin: 0 -0.75in;
  border-top: 0.7pt dashed var(--muted);
}
.tear svg {
  position: absolute;
  top: -5.5pt;
  display: block;
  box-sizing: content-box;
  width: 11pt;
  height: 11pt;
  padding: 0 4pt;
  background: #ffffff;
  color: var(--muted);
}
.tear .left { left: 0.34in; }
.tear .right { right: 0.34in; transform: scaleX(-1); }

.stub-grid {
  display: flex;
  gap: 0.45in;
  margin-top: 12pt;
}
.stub-grid > div { flex: 1 1 0; }
.stub-grid > div.wide { flex: 1.25 1 0; }
.stub .who { font-weight: 700; font-size: 9.5pt; }
.stub .line { font-size: 8pt; color: var(--ink); line-height: 1.26; }
.stub .amt { font-weight: 700; font-size: 11pt; }
.fill {
  display: flex;
  align-items: baseline;
  gap: 5pt;
  margin-top: 4pt;
  font-size: 8pt;
  color: var(--ink);
  white-space: nowrap;
}
.fill .blank { flex: 1 1 auto; border-bottom: 0.6pt solid var(--ink); height: 9pt; }
.stub .hint { margin-top: 5pt; font-size: 7pt; color: var(--ink); }

.notes { margin-top: 11pt; font-size: 8.5pt; color: var(--ink); max-width: 5.2in; }

`;

export function renderHtml(inv) {
  const {
    number, dateLong, dueLong, clientName, dek,
    ad, subtotal, taxLine, total, config, notes, paid, paidLong,
  } = inv;

  const lineRows = ad.lines
    .map(
      (l) => `
      <tr>
        <td class="desc">${esc([l.aspect, l.detail].filter(Boolean).join(" \u00b7 "))}</td>
        <td class="num rate">${esc(l.rateFmt ?? "")}</td>
        <td class="num qty">${esc(l.qtyFmt ?? "")}</td>
        <td class="num amount">${esc(l.amountFmt)}</td>
      </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Invoice ${esc(number)} — ${esc(clientName)}</title>
<style>${css}</style>
</head>
<body>

<header class="masthead">
  <div class="metaband">
    <span class="left">Invoice No. ${esc(number)}</span>
    <span class="mid">${esc(dateLong)}</span>
    <span class="right">${paid ? `Paid ${esc(paidLong)}` : `Due ${esc(dueLong)}`}</span>
  </div>
  ${logo()}
</header>

<div class="kicker">${paid ? "Advertising Receipt" : "Advertising Invoice"}</div>
<h1>${esc(clientName)}</h1>
${dek ? `<p class="dek">${esc(dek)}</p>` : ""}

<section class="party">
  <div class="who">${esc(config.publication)}</div>
  ${config.fromAddress.map((l) => `<div class="line">${esc(l)}</div>`).join("")}
  ${config.billingEmail ? `<div class="line subtle">${esc(config.billingEmail)}</div>` : ""}
</section>

<section class="ad">
  <div class="who">${esc(ad.name)}</div>
  ${ad.dimensions ? `<div class="line">${esc(ad.dimensions)}</div>` : ""}
  ${ad.run ? `<div class="line">${esc(ad.run)}</div>` : ""}
</section>

<table>
  <thead>
    <tr>
      <th>Description</th>
      <th class="num rate">Unit price</th>
      <th class="num qty">Quantity</th>
      <th class="num amount">Amount</th>
    </tr>
  </thead>
  <tbody>${lineRows}</tbody>
</table>

<div class="totals">
  <div class="row"><span class="k">Subtotal</span><span class="v">${esc(subtotal)}</span></div>
  ${taxLine ? `<div class="row"><span class="k">${esc(taxLine.label)}</span><span class="v">${esc(taxLine.value)}</span></div>` : ""}
  <div class="due">
    <span class="k">${paid ? "Paid in full" : "Amount due"}</span>
    <span class="v">${esc(total)}</span>
  </div>
  ${paid ? `<div class="settled">Received ${esc(paidLong)}${paid.check ? ` &nbsp;·&nbsp; check no. ${esc(paid.check)}` : ""}</div>` : ""}
</div>

${paid ? "" : `<section class="payment">
  <div class="label">Payment</div>
  <div class="payee">${esc(config.paymentMethods)}</div>
  <div class="memo">Make checks payable to <strong>${esc(config.payableTo)}</strong>, with
  <strong>${esc(inv.checkMemo)}</strong> on the memo line.</div>
</section>`}

${notes ? `<p class="notes">${esc(notes)}</p>` : ""}

${paid ? "" : `<section class="stub">
  <div class="tear">
    <svg class="left" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6.5" cy="6.5" r="2.6"/><circle cx="6.5" cy="17.5" r="2.6"/><path d="M8.7 8.4 21 20.5"/><path d="M8.7 15.6 21 3.5"/></svg>
    <svg class="right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6.5" cy="6.5" r="2.6"/><circle cx="6.5" cy="17.5" r="2.6"/><path d="M8.7 8.4 21 20.5"/><path d="M8.7 15.6 21 3.5"/></svg>
  </div>
  <div class="stub-grid">
    <div class="wide">
      <div class="who">${esc(clientName)}</div>
      <div class="line">Invoice No. ${esc(number)} &nbsp;·&nbsp; Due ${esc(dueLong)}</div>
    </div>
    <div>
      <div class="label">Mail with payment to</div>
      ${config.remitTo.map((l) => `<div class="line">${esc(l)}</div>`).join("")}
    </div>
    <div>
      <div class="label">Amount</div>
      <div class="amt">${esc(total)} due</div>
      <div class="fill"><span>Enclosed $</span><span class="blank"></span></div>
      <div class="fill"><span>Check no.</span><span class="blank"></span></div>
      <div class="hint">Leave blank if paying cash</div>
    </div>
  </div>
</section>`}


</body>
</html>`;
}
