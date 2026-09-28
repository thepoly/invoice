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
  --ink-70: #4a4a4a;
  --ink-55: #5f5f5f;
  --ink-35: #949494;
  --accent: #D6001C;
  --rule: rgba(0, 0, 0, 0.18);
  --rule-strong: rgba(0, 0, 0, 0.85);
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
  margin-top: 11pt;
  padding: 4.5pt 0;
  border-top: 0.75pt solid var(--ink);
  border-bottom: 0.75pt solid var(--ink);
  font-size: 7pt;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
/* Equal-weight flanks so the date lands on the true centre of the page. */
.metaband .left,
.metaband .right { flex: 1 1 0; }
.metaband .mid { flex: 0 0 auto; white-space: nowrap; color: var(--ink-55); font-weight: 500; }
.metaband .right { text-align: right; font-weight: 600; }

/* ── Title block ──────────────────────────────────────── */

.kicker {
  margin-top: 16pt;
  color: var(--accent);
  font-size: 7.5pt;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1 {
  font-family: "Minion Pro", Georgia, serif;
  font-size: 25pt;
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: -0.005em;
  margin-top: 5pt;
}

.dek {
  margin-top: 6pt;
  font-size: 9.5pt;
  font-weight: 400;
  color: var(--ink-55);
  max-width: 4.6in;
}

/* ── Parties ──────────────────────────────────────────── */

.parties {
  display: flex;
  gap: 0.55in;
  margin-top: 15pt;
}
.party { flex: 1 1 0; }

.label {
  font-size: 6.5pt;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-35);
  margin-bottom: 4pt;
}

.party .who { font-weight: 700; font-size: 10pt; }
.party .line { color: var(--ink-70); line-height: 1.32; }
.party .line.subtle { color: var(--ink-55); }

/* ── Line items ───────────────────────────────────────── */

table { width: 100%; border-collapse: collapse; margin-top: 18pt; }

thead th {
  font-size: 6.5pt;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-35);
  text-align: left;
  padding-bottom: 5pt;
  border-bottom: 0.6pt solid var(--ink);
}
th.num, td.num { text-align: right; white-space: nowrap; }
th.qty, td.qty { text-align: right; width: 0.6in; }
th.rate, td.rate { width: 1.0in; }
th.amount, td.amount { width: 1.1in; }

tbody tr { break-inside: avoid; }
tbody td { padding: 8pt 0 0; vertical-align: baseline; }
tbody tr:last-child td { padding-bottom: 6pt; }

td .desc { font-weight: 600; font-size: 10pt; }
td .detail { font-size: 8.5pt; color: var(--ink-55); margin-top: 1.5pt; }
td.num { font-weight: 400; color: var(--ink-70); }
td.amount { font-weight: 600; color: var(--ink); }

/* ── Totals ───────────────────────────────────────────── */

.totals { margin-left: auto; width: 2.9in; }

.totals .row {
  display: flex;
  justify-content: space-between;
  padding: 3.5pt 0;
  font-size: 9.5pt;
  color: var(--ink-55);
}
.totals .row .k { letter-spacing: 0.01em; }
.totals .row .v { font-weight: 500; color: var(--ink-70); }

.totals .due {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 6pt;
  padding-top: 8pt;
  border-top: 0.9pt solid var(--rule-strong);
}
.totals .due .k {
  font-size: 7pt;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.totals .due .v { font-size: 16pt; font-weight: 700; letter-spacing: -0.01em; }

.totals .settled {
  margin-top: 5pt;
  text-align: right;
  font-size: 8pt;
  color: var(--ink-55);
}

/* ── Payment ──────────────────────────────────────────── */

.payment {
  margin-top: 14pt;
  padding-top: 9pt;
  border-top: 0.6pt solid var(--rule);
}
.payment .payee { font-weight: 700; font-size: 11pt; }
.payment .line { color: var(--ink-70); line-height: 1.32; }
.payment .memo { margin-top: 6pt; font-size: 8.5pt; color: var(--ink-55); max-width: 5.4in; }
.payment .memo strong { font-weight: 700; color: var(--ink); }


.stub { margin-top: 14pt; }

/* The tear line runs the full width of the sheet, out through both page margins. */
.tear {
  position: relative;
  margin: 0 -0.75in;
  border-top: 0.7pt dashed rgba(0, 0, 0, 0.4);
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
  color: var(--ink-35);
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
.stub .line { font-size: 8pt; color: var(--ink-70); line-height: 1.26; }
.stub .amt { font-weight: 700; font-size: 11pt; }
.fill {
  display: flex;
  align-items: baseline;
  gap: 5pt;
  margin-top: 4pt;
  font-size: 8pt;
  color: var(--ink-55);
  white-space: nowrap;
}
.fill .blank { flex: 1 1 auto; border-bottom: 0.6pt solid var(--rule-strong); height: 9pt; }
.stub .hint { margin-top: 5pt; font-size: 7pt; color: var(--ink-35); }

.notes { margin-top: 11pt; font-size: 8.5pt; color: var(--ink-55); max-width: 5.2in; }

`;

export function renderHtml(inv) {
  const {
    number, dateLong, dueLong, termsLabel, clientName, dek,
    billTo, items, subtotal, taxLine, total, config, notes, paid, paidLong,
  } = inv;

  const itemRows = items
    .map(
      (it) => `
      <tr>
        <td>
          <div class="desc">${esc(it.description)}</div>
          ${it.detail ? `<div class="detail">${esc(it.detail)}</div>` : ""}
        </td>
        <td class="num qty">${esc(it.qty)}</td>
        <td class="num rate">${esc(it.rateFmt)}</td>
        <td class="num amount">${esc(it.amountFmt)}</td>
      </tr>`
    )
    .join("");

  const billLines = billTo.lines.map((l) => `<div class="line">${esc(l)}</div>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Invoice ${esc(number)} — ${esc(clientName)}</title>
<style>${css}</style>
</head>
<body>

<header class="masthead">
  ${logo()}
  <div class="metaband">
    <span class="left">Invoice No. ${esc(number)}</span>
    <span class="mid">${esc(dateLong)}</span>
    <span class="right">${paid ? `Paid ${esc(paidLong)}` : `${esc(termsLabel)} &nbsp;·&nbsp; Due ${esc(dueLong)}`}</span>
  </div>
</header>

<div class="kicker">${paid ? "Advertising Receipt" : "Advertising Invoice"}</div>
<h1>${esc(clientName)}</h1>
${dek ? `<p class="dek">${esc(dek)}</p>` : ""}

<section class="parties">
  <div class="party">
    <div class="label">Billed to</div>
    <div class="who">${esc(billTo.name)}</div>
    ${billTo.attn ? `<div class="line subtle">Attn: ${esc(billTo.attn)}</div>` : ""}
    ${billLines}
    ${billTo.email ? `<div class="line subtle">${esc(billTo.email)}</div>` : ""}
  </div>
  <div class="party">
    <div class="label">From</div>
    <div class="who">${esc(config.publication)}</div>
    ${config.fromAddress.map((l) => `<div class="line">${esc(l)}</div>`).join("")}
    ${config.billingEmail ? `<div class="line subtle">${esc(config.billingEmail)}</div>` : ""}
  </div>
</section>

<table>
  <thead>
    <tr>
      <th>Placement</th>
      <th class="num qty">Qty</th>
      <th class="num rate">Rate</th>
      <th class="num amount">Amount</th>
    </tr>
  </thead>
  <tbody>${itemRows}</tbody>
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
  <div class="memo">Checks payable to <strong>${esc(config.payableTo)}</strong>, with
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
      <div class="hint">Leave the check number blank if paying cash.</div>
    </div>
  </div>
</section>`}


</body>
</html>`;
}
