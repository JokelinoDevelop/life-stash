# LifeStash — Invoice documents spec (F4)

Status: **built** (F4a + F4b) · Written 2026-11-20 · Extends `docs/FINANCES-SPEC.md` (read it first).

Today an invoice is a record: number, client, dates, amount, status and the PDF you made elsewhere (Wise's invoice generator). F4 lets you **write the invoice in LifeStash** — your details, the client's, line items — and get the PDF from it, so the record and the document are one thing.

Everything in `CLAUDE.md` applies. Use the `new-endpoint` and `new-form` skills.

## Goals

- Create an itemised invoice in a minute and download a clean PDF to send.
- Numbers that follow the book: unique, sequential per year, no gaps, never reused.
- An issued invoice never changes afterwards; what the client received is what the app keeps.
- Invoices made elsewhere (the Wise ones) can still be recorded with their PDF, as today.

## Not in F4

Logo, emailing invoices (F5), credit notes (F5), payment QR code, "PAID" stamp / payment receipt, several number series, recurring invoices, tax calculations beyond a VAT rate per line.

## Invoice numbers

**Format `YYYY-NNN`, counted per year** (`2026-012`, then `2027-001` from January 1). The year is the issue date's year. `NNN` is a minimum width: after `999` comes `1000`.

- **Stored as integers**: `number_year` + `number_seq` next to the display `number`. Unique on (household_id, number_year, number_seq) and on (household_id, number). The next number is `max(number_seq) + 1` for the year, never parsed from text at runtime.
- **Drafts have no number.** The list and form show "Draft". The number is assigned when the invoice is **issued**, so deleting a draft never leaves a gap.
- **Issuing** suggests the next number ("Next after 2026-011"). It can be overridden (e.g. when catching up), but must parse as `YYYY-NNN` or a plain `NNN`, and must be free.
- **Recording past invoices** (made elsewhere): you type the number exactly as the client received it. A plain number like `011` is stored as typed and counts as seq 11 of its issue year, so the next suggestion after the Wise invoices `001`–`011` is `2026-012`.
- **No deletes after issuing.** A sent or paid invoice can only be **voided**: it stays in the list struck through, its number stays used. Drafts can be deleted (confirm + Undo, as today).
- **Settings**: the "Invoice number format" setting keeps `YYYY-NNN` (default) and `YYYY/NNN`; `NNN` (never resets) stays available for households that want it. Existing numbers are backfilled into `number_year`/`number_seq` by the migration (plain numbers use their issue year).

## What the invoice looks like

A4, one page for typical invoices (lines flow onto a second page with the header repeated). Language follows the client (`en` / `mk`), amounts in the invoice currency, formatted for that language.

```
Business name                                  INVOICE
        Address line 1                          No.       2026-012
        Address line 2                          Issued    20.11.2026
        Tax ID · email · phone                  Due       20.12.2026
                                                Period    01.11–30.11.2026
Bill to
Client name
Address · Tax ID

Description                         Qty     Unit price      VAT     Amount
Development — November           80.00 hrs  €40.00          0%      €3,200.00
Hosting                              1.00     €25.00          0%         €25.00
──────────────────────────────────────────────────────────────────────────
                                            Subtotal                €3,225.00
                                            VAT                         €0.00
                                            Amount due              €3,225.00

Payment                                 Reference: 2026-012
Bank · IBAN · SWIFT/BIC

Notes (per invoice) · footer (from your profile, e.g. "Not a VAT payer")
```

- Text-only header (no logo in v1; can be added later as a profile field).
- The **Period** line (the dates the invoice bills for, from `period_start`/`period_end`) only appears when it is filled.
- Typography follows the app (Inter, embedded with Cyrillic glyphs), greyscale with the one accent for "Amount due".
- When the business is **not VAT registered**, the VAT column and VAT total are hidden and the footer shows the configured note.
- The VAT total is grouped per rate when lines use different rates.
- File name: `Invoice-2026-012.pdf` / `Faktura-2026-012.pdf`.

## Rules

- **Unit** (optional, per line): free text up to 12 characters, with quick picks `hrs` · `days` · `pcs` (translated: `ч.` · `дена` · `пар.`). Printed after the quantity ("80.00 hrs"); empty for one-off items such as a monthly fee. Duplicating an invoice keeps it.
- **Line amount** = quantity × unit price, rounded half-up to the minor unit, per line. VAT is computed per line and rounded, then summed. The invoice `amount_minor` is the total, so everything that already uses it (status, mark paid, overview, receivables) keeps working.
- **Itemised vs recorded**: an invoice with lines is _itemised_ (amount computed, PDF generated by the app). One without lines is _recorded_ (amount typed, PDF attached by hand) — today's flow, kept for invoices made elsewhere.
- **Freeze on issue**: issuing copies your business profile and the client's billing details into the invoice (`issuer_snapshot`, `client_snapshot`) and locks the lines. Later edits to your profile or the client never change an issued invoice.
- **Locked after issuing**: an issued invoice's content (client, dates, lines, amount, number) can't be edited; notes and files can. To fix a mistake: void it and duplicate it into a new draft. (Paid invoices stay locked until marked unpaid, as today; un-marking paid does not unlock the content.)
- **The PDF**: generated in the browser from the frozen data at issue time and stored as the invoice's attachment (flagged `generated`), so the file you sent is kept byte for byte. "Download" serves the stored file; without storage configured it re-renders from the frozen data.
- **Issuing requires** a business profile with at least a name, and a client with a name. Missing → a field error pointing to the profile or client.
- **Due date** defaults to issue date + the client's terms, as today.

## Data model changes (`src/worker/db/schema/finances.ts`)

### `finance_business_profile` (new, one row per household)

household_id (pk), name, address (multi-line text), tax_id?, company_id?, email?, phone?, bank_name?, iban?, swift?, vat_registered (bool, default false), default_vat_rate_bp (basis points, default 0), footer_note?, updated_at

### `finance_clients` (new columns)

address?, tax_id?, invoice_language (`en` | `mk`, default from the household locale)

### `finance_invoices` (new / changed columns)

number becomes nullable (drafts), number_year?, number_seq?, issuer_snapshot? (JSON text), client_snapshot? (JSON text), voided_at?, issued_at?

Unique: (household_id, number_year, number_seq) where not null; (household_id, number) where not null.

### `finance_invoice_lines` (new)

id, household_id, invoice_id, position, description, quantity_milli (integer, 1.5 → 1500), unit? (text, max 12), unit_price_minor, vat_rate_bp, amount_minor, vat_minor

Index: (household_id, invoice_id).

### `photos`

Add `generated` (bool) for app-made invoice PDFs.

## Shared domain (`src/shared/domain/finances/*`, with tests)

- `lineAmounts({ quantityMilli, unitPriceMinor, vatRateBp })` → `{ amountMinor, vatMinor }` (half-up).
- `invoiceTotals(lines)` → `{ subtotalMinor, vatByRate, vatMinor, totalMinor }`.
- `parseInvoiceNumber(text, issueYear)` → `{ year, seq } | null` (accepts `YYYY-NNN`, `YYYY/NNN`, `NNN`).
- `formatInvoiceNumber(year, seq, format)`; `nextInvoiceSeq(seqsOfYear)`.
- Replace the string-scanning `nextInvoiceNumber` with the above.

## API (`/api/finances/*`)

| Method | Path | Notes |
| --- | --- | --- |
| GET / PUT | `/finances/business-profile` | Your details for invoices |
| POST / PATCH | `/finances/clients[/:id]` | + address, taxId, invoiceLanguage |
| POST / PATCH | `/finances/invoices[/:id]` | + optional `lines[]`; with lines the server computes the amount. PATCH refused once issued (`finances.invoice_issued`) except notes |
| POST | `/finances/invoices/:id/issue` | `{ number? }` → assigns the number, freezes snapshots, status `sent`. Replaces `mark-sent` |
| GET | `/finances/invoices/:id/document` | The frozen data the PDF is rendered from (snapshots, lines, totals, language) |
| POST | `/finances/invoices/:id/void` | Sent invoices only |
| DELETE | `/finances/invoices/:id` | Drafts only (`finances.invoice_issued` otherwise) |
| GET | `/finances/invoices/next-number?year=` | Now from `number_seq` |

New error codes: `finances.invoice_issued`, `finances.invoice_number_invalid`, `finances.profile_incomplete`.

## Screens

- **Settings › Finances › Your details** (new section): business name, address, tax ID, company ID, email, phone, bank, IBAN, SWIFT, VAT registered + default rate, footer note. A small preview of the invoice header.
- **Client dialog (3.6)**: + address, tax ID, invoice language.
- **Invoice editor (3.3, `size="full"` on desktop)**: form on the left, live A4 preview on the right (scaled to fit). Client, issue date, due date, work period, line items (add row, reorder, remove; qty, unit, unit price, VAT if registered), notes. "Record an invoice made elsewhere" switches to today's amount + file flow. Footer: **Save draft** · **Issue & download** `⌘↵` (confirm shows the number it will get). Phones: full-height sheet, "Preview" opens the PDF.
- **Invoice detail (3.4)**: issued invoices show **Download PDF**, **Duplicate**, **Void** (confirm); drafts show Edit and Delete.
- **Invoices list (2.1)**: drafts show "Draft" instead of a number; voided invoices struck through in their own group.
- **⌘K**: "Download invoice 2026-012" on matching invoices.

## Technical notes

- PDF rendering with `@react-pdf/renderer`, **lazy-loaded** (only when previewing or issuing) so it doesn't weigh on the app bundle. Register Inter TTF files with Latin + Cyrillic.
- The same React component renders the live preview and the final PDF from the `document` data shape, so they can't drift.
- Upload the generated PDF through the existing photos pipeline (upload-url → PUT → create, owner `finance_invoice`, `generated: true`).

## Phases

1. **F4a — Profile and numbering**: business profile + Settings section; client billing fields; numbering columns + migration/backfill; drafts without numbers; issue / void; no deletes after issuing.
2. **F4b — Itemised invoices and PDF**: line items + domain totals; editor with live preview; PDF component; issue & download; stored generated PDF; seeders (a demo profile, client addresses, two itemised invoices).
3. **F5 — Later**: email the invoice from the app (Cloudflare Email Service), credit notes (own series `CN-YYYY-NNN`), payment receipt, payment QR.

## Decisions made while building

- **Work period**: printed only when filled. The editor keeps today's month picker (period = first–last day of a month).
- **Note on the PDF**: the invoice's `description` is printed under the lines ("Note on the invoice" in the editor). `notes` stay private: they are never printed, so they can still be edited after issuing without the PDF drifting from the frozen data.
- **Profile requirement**: only _itemised_ invoices need a business profile to be issued (`finances.profile_incomplete`). Recorded invoices (made elsewhere) can be issued without one; they keep an issuer snapshot only if a profile exists.
- **Number override**: a typed `YYYY-NNN` must be of the issue year (else `finances.invoice_number_invalid`); it is stored as typed. An empty number field takes the next number. With `NNN` the sequence counts across years.
- **Migration**: existing drafts lose their number (they get one when issued). Numbers in other shapes keep their text but no sequence. If two legacy numbers mean the same sequence (`011` and `2026-011`), only the oldest keeps it.
- **Void / paid on drafts**: a draft can't be voided or marked paid (`finances.invoice_not_issued`, a new code); delete it instead.
- **VAT**: when not VAT registered, the server stores 0% on every line, whatever was sent.
- **Generated PDF**: the stored file (`photos.generated`) can't be removed from the Files list; it goes only with the invoice. "Download PDF" opens the stored file, or draws it again from the frozen data when storage isn't set up (or for invoices issued before the PDF existed).
- **Issuing from the list** (row "Issue" or ⌘K): an itemised draft also gets its PDF drawn and stored (no download).
- **PDF**: no page numbers (react-pdf's dynamic `render` text didn't draw reliably); the column header repeats when lines run onto another page. The react-pdf chunk (~1.2 MB) is excluded from the PWA precache.
- **Dialog size**: the editor is `size="full"` (desktop) / full-height sheet (phones) while itemised; recorded invoices and issued ones use the normal large dialog.
