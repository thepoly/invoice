# The Polytechnic — advertising invoices

Generates advertising invoices as PDFs, styled to match [poly.rpi.edu](https://poly.rpi.edu):
the masthead logo, Raleway throughout, a Minion Pro headline, horizontal hairlines only,
and red reserved for the logo and the kicker.

Invoices are payable by cash or check. You email the PDF; they mail payment with the
detached remittance slip; you record it here.

## Running it

It's a terminal program — there's no window or app to click. Open Terminal, go to
this folder once, and stay there:

```bash
cd ~/Code/business
```

Then run the commands below. Everything writes into `out/`.

Requirements are Node and Google Chrome, both already on this machine. Nothing to
install — no `npm install`, no dependencies. Chrome is used headlessly to print the
PDF; if yours lives somewhere unusual, set `CHROME_PATH`.

## Before the first real invoice

`config.json` holds everything about you. The check details are set:

- `defaultNotes` — the note copied into each new invoice; carries "All rates
  subject to change"
- `paymentMethods` — `Cash or check`
- `payableTo` — `Rensselaer Polytechnic Institute` (checks only; cash has no payee)
- `checkMemoTemplate` — `Polytechnic Advertising ({number})`; `{number}` is replaced
  per invoice so a payment can be matched to what it settles
- `remitTo` — the mail-to block, ATTN: Nicole Hollister
- `fromAddress` — the shorter address in the "From" column

Still unverified: `billingEmail` (`ads@poly.rpi.edu`), `billingPhone`, `taxId`, and
`taxRate`, which is `0`. New York generally does not tax advertising services, but
confirm before assuming it for print placements.

`defaultTermsDays` is `30`, which prints as "Net 30" — the balance is due 30 days
after the invoice date. Set it to `0` for "Due on receipt", or override per invoice
with `termsDays`.

## Use

```bash
node bin/invoice.js new eighth-street-books   # scaffold data/invoices/1002.json
node bin/invoice.js render 1002               # write out/Poly-Invoice-1002-….pdf
node bin/invoice.js render 1002 --open        # …and open it
node bin/invoice.js render --all              # re-render everything
node bin/invoice.js list                      # who still owes you money
node bin/invoice.js paid 1002 --check 8871    # record a check
```

`render --html` writes HTML instead of PDF, which is faster when you're
adjusting the design.

## Layout

```
config.json            your details — the from-address, who checks are payable to
data/clients.json      advertisers, keyed by a short slug
data/invoices/<n>.json one file per invoice; the number is the filename
lib/template.js        the design (CSS + HTML)
lib/build.js           totals, dates, formatting
lib/pdf.js             headless Chrome
out/                   generated PDFs (gitignored)
assets/                logo + fonts, copied from the poly repo
```

## An invoice file

```json
{
  "number": "1001",
  "date": "2026-09-09",
  "client": "eighth-street-books",
  "termsDays": 30,
  "items": [
    {
      "description": "Full page, back cover",
      "detail": "Vol. CXLIII No. 10 · September 9, 2026",
      "qty": 1,
      "rate": 475
    }
  ],
  "notes": "Ad artwork due five business days before each issue date.",
  "paid": null
}
```

`detail` is the small gray line under each placement — use it for the issue and date.
Set `"client"` to a key from `data/clients.json`, or inline the whole object.

`notes` is the paragraph under the payment block. `new` seeds it from `defaultNotes`
in `config.json`, so the rates-subject-to-change line is there by default; edit it per
invoice as needed.

Once `paid` is filled in, the same file renders as a **receipt** instead: the kicker
becomes "Advertising Receipt", the total reads "Paid in full" with the check number,
and the mail-a-check block disappears. So you can send the same PDF back as confirmation.

## Numbering

`new` takes the highest existing number and adds one, starting at 1001. Invoice numbers
should stay sequential and should never be reused — keep the JSON files even after
an invoice is paid, and don't renumber.

## Pages

One page: the invoice, then a payment slip below a dashed tear line that bleeds to
both edges of the sheet, marked with scissors. The advertiser cuts it off and mails it
with the cash or check so the payment can be matched to an invoice — it repeats the
advertiser, the invoice number, the amount due, the mailing address, and gives blanks
for the amount enclosed and the check number.

For the tear line to reach the paper's edge, `@page` carries no margin and the page
margins sit on `body` instead. That is only correct while the invoice is one page —
a second page would start hard against the top edge. The page guard below is what
keeps that honest, so don't ignore it.

A **receipt** (an invoice with `paid` filled in) drops the slip.

The page is budgeted to about 780px of its 944px content area. `render` counts pages
and warns if it spills, usually from a long `notes` line or many placements.

To see where the space goes, temporarily add this to a rendered HTML file and open it:

```js
document.querySelectorAll("header,.parties,table,.totals,.payment,.stub")
  .forEach(e => console.log(e.className, e.getBoundingClientRect().height));
```

The content area is 944px tall at 96dpi.

## Design notes

The page carries horizontal rules only — no vertical ones, no boxes, no fills. The
slip's tear line is the one dashed rule; the fill-in blanks are underlines. There is
no page footer and no terms block.
Hierarchy comes from weight and from three levels of black (`#000`, `#5f5f5f`, `#949494`).
Red (`#D6001C`) appears exactly twice: the masthead and the kicker.

Fonts and the logo are copied into `assets/` from `../poly/public/`. If the site's
brand changes, re-copy them.

## Advertising terms (not printed)

The invoice carries no terms. This wording was drafted for it and is kept here in
case it belongs somewhere else later — a rate card, an insertion order, or the ad
page on the site. It is boilerplate modelled on how newspaper rate cards are normally
written, not legal advice, and it asserts protections on behalf of RPI and the Union,
so it should be reviewed before being used anywhere binding.

> All rates are subject to change. Advertisements are printed only in the issues listed above; no additional insertions are made without a new order. The Polytechnic reserves the right to refuse, reject, cancel, or omit any advertisement at any time, and to label any advertisement as such. Position is not guaranteed unless separately purchased. The advertiser represents that the submitted material is accurate, lawful, and does not infringe the rights of any third party, and agrees to hold The Polytechnic, the Rensselaer Union, and Rensselaer Polytechnic Institute harmless from any claim arising out of its publication. Liability for any error is limited to the cost of the space occupied by the error, and no allowance is made for errors that do not materially affect the value of the advertisement. Accounts not paid within the stated terms may be referred for collection. Cash payments are made at the sender’s own risk; The Polytechnic is not responsible for cash lost in transit and can credit an account only for payment actually received.
