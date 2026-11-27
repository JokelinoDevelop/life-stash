# LifeStash — Finances module spec

Status: **built** — F1 (ledger), F2 (work), F3 (extras) and F4 (invoice documents) done · Written 2026-11-19 · Mocks: ["LifeStash Finances" design canvas](https://claude.ai/artifact/MssgjHtjxpUoKie1rvC5wt)

Finances replaces the Excel sheet where work invoices are tracked by hand, and adds a light personal spending log. It is for one person's own organisation: no accounting, no tax filing, no bank sync.

Read `docs/ARCHITECTURE.md`, `docs/DATA-MODEL.md` and `docs/DESIGN-LANGUAGE.md` first. Everything in `CLAUDE.md` applies (own DTOs per endpoint, own schema + mapper per form, `householdId` on every query, minor units, i18n `en` + `mk`).

## Questions it answers

- Who owes me money right now, and since when?
- How much did I earn this month / this year, and from whom?
- How much did I spend, and on what?
- What's left over (income − spending) per month?

## Concepts

| Concept | What it is |
| --- | --- |
| **Transaction** | One money movement: income or expense, a date, an amount, a category. The ledger is the source of truth for every total. |
| **Category** | User-editable label, either an income or an expense category (Salary, Freelance, Groceries, Rent…). Seeded with defaults. |
| **Client** | Who pays you: an employer or a client. Holds a default currency and payment terms. |
| **Invoice** | A bill sent to a client. Has a number, issue and due dates, an amount and a status. Not money yet: it turns into an income transaction when it is marked paid. |
| **Project** (phase F3) | Optional grouping of invoices under one client, to see what a project earned in total. |
| **Recurring income** (phase F3) | A template such as "Salary, ACME, €2,400 on the 25th" that suggests a transaction each month. You confirm it; nothing is booked by itself. |

## Rules

- **Amounts** are integer minor units plus a currency (`MKD` | `EUR` | `USD`), as in Garage. Totals are grouped per currency (`sumByCurrency`). When the user has entered exchange rates (Settings › Finances › Exchange rates), the overview KPIs add every currency up in the main currency (`totalInCurrency`) and list the other currencies as "incl. €53,750"; without a rate they show the main currency first and others as a second line.
- **Invoice status** is stored as `draft` | `sent` | `paid` | `void`. **Overdue** is derived, never stored: `sent` and `due_date < today` (in the user's time zone).
- **Marking an invoice paid** asks for the paid date and the amount received (defaults: today, the invoice amount), then creates one income transaction linked to the invoice (`invoice_id`) in the category "Invoices". Un-marking deletes that transaction. A paid invoice can't be edited until it is un-marked.
- **Invoice numbers** (F4): `YYYY-NNN` counted per issue year, stored as `number_year` + `number_seq`. Drafts have no number; it is assigned when the invoice is issued (the next one, or a typed `YYYY-NNN` / plain `NNN` of the issue year that is free). Issued invoices are voided, never deleted; only drafts can be deleted. See `docs/INVOICE-DOCUMENTS-SPEC.md`.
- **Due date** defaults to issue date + the client's payment terms (default 30 days).
- **Garage costs are not copied** into the ledger. The overview shows a read-only "Car costs" line, read from Garage's spending service (service → service), so nothing is counted twice.
- **Deleting**: a category or client that's in use is archived, not deleted. Deleting a transaction or a draft invoice uses `confirm()` and then an Undo toast; issued invoices can only be voided.

## Attachments (invoice PDFs and receipts)

Reuse the existing photo pipeline (B2, presigned URLs, `photos` table, `modules/photos`) instead of a second storage path.

- **What**: invoices take the PDF you sent (plus anything else, e.g. a timesheet); transactions take a receipt (photo or PDF). Several files per record.
- **Changes to `photos`**: `owner_type` gains `finance_invoice` and `finance_transaction`; add `file_name?` (original name, shown in the UI). Upload DTOs accept `application/pdf` next to the image types; PDFs up to 10 MB (images stay at 5 MB). PDFs are uploaded as-is; only images are resized/compressed in the browser.
- **Viewing**: images open in the existing viewer; PDFs open in a new tab from a 1-hour presigned GET URL (`Content-Disposition: inline; filename=…`).
- **Rules**: the owner is authorised like everything else (the invoice/transaction must belong to the household). Deleting an invoice or transaction deletes its files from B2 (same as Garage). Files on a paid invoice can still be added or removed (they're evidence, not invoice data). If B2 isn't configured, the attach controls are hidden.
- **Not included**: reading data out of the PDF (OCR / auto-fill). Generating invoice PDFs is F4 (`docs/INVOICE-DOCUMENTS-SPEC.md`).

## Data model (`src/worker/db/schema/finances.ts`)

All tables carry `household_id`; ids are UUIDs; dates are `YYYY-MM-DD`.

### `finance_categories`

id, household_id, kind (`income`/`expense`), name, icon? (lucide name), position, archived_at?, created_at

### `finance_clients`

id, household_id, name, kind (`employer`/`client`), currency, payment_terms_days (default 30), email?, notes?, archived_at?, created_at, updated_at

### `finance_invoices`

id, household_id, client_id, project_id? (F3), number, issue_date, due_date, period_start?, period_end? (the work period it bills, e.g. "October"), description?, amount_minor, currency, status (`draft`/`sent`/`paid`/`void`), sent_at?, paid_at?, overdue_notified_at? (F3 push), notes?, created_at, updated_at

Unique: (household_id, number).

### `finance_transactions`

id, household_id, kind (`income`/`expense`), date, amount_minor (always positive), currency, category_id, client_id? (income), invoice_id? (unique; set when created by "mark paid"), recurring_id? (F3), description, notes?, created_at, updated_at

Indexes: (household_id, date), (household_id, category_id).

### `finance_settings` (one row per household)

household_id (pk), default_payment_terms_days (30), invoice_number_format (`YYYY-NNN`), overdue_reminders (bool), updated_at. Main currency stays in `user_preferences.currency`.

### Phase F3

- `finance_projects`: id, household_id, client_id, name, status (`active`/`done`), notes?, created_at, updated_at
- `finance_recurring`: id, household_id, kind, client_id?, category_id, description, amount_minor, currency, day_of_month, active, last_handled_month? (`YYYY-MM`, set on Confirm or Skip), created_at, updated_at

## Shared domain (`src/shared/domain/finances/*`, with tests)

- `invoiceStatus(invoice, today)` → `draft` | `sent` | `overdue` | `paid` | `void`, plus `daysOverdue`.
- `parseInvoiceNumber(text, issueYear)`, `formatInvoiceNumber(year, seq, format)`, `nextInvoiceSeq(seqs)` (F4; replaced `nextInvoiceNumber`).
- `lineAmounts(line)`, `invoiceTotals(lines)`, `invoiceFileName(number, language)` in `invoice-document.ts` (F4).
- `defaultDueDate(issueDate, termsDays)`.
- `monthlyCashflow(transactions, year)` → per month and currency: income, expense, net.
- `categoryBreakdown(transactions, range)` → totals per category, sorted, with share %.
- `receivables(invoices, today)` → unpaid total per currency, overdue total, oldest overdue.

## API (`/api/finances/*`)

Each endpoint has its own `dto/<endpoint>.request.ts` and `.response.ts`. Controller → service → repository per sub-feature (`transactions/`, `categories/`, `clients/`, `invoices/`, `overview/`).

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/finances/overview?from=&to=&categoryId=&clientId=` | One request for the overview page. No `from`/`to` = all time (first entry → today). KPIs for the range + the same-length period before, receivables, cashflow per bucket (month ≤ 24 months, quarter ≤ 5 years, else year), highlights (monthly averages, kept of income, best/worst month), top categories with a trend per bucket, recent transactions, car costs |
| GET | `/finances/transactions?from&to&kind&categoryId&clientId&q&cursor` | Paged, newest first |
| POST / PATCH / DELETE | `/finances/transactions[/:id]` |  |
| GET / POST / PATCH | `/finances/categories[/:id]` | PATCH also archives / reorders |
| GET / POST / PATCH | `/finances/clients[/:id]` | GET list includes per-client year totals and unpaid amount |
| GET | `/finances/clients/:id` | Client detail: invoices + income history |
| GET | `/finances/invoices?status&clientId&year` |  |
| GET | `/finances/invoices/next-number` | Suggested number for the form |
| POST / PATCH / DELETE | `/finances/invoices[/:id]` |  |
| POST | `/finances/invoices/:id/issue` | F4: `{ number }` → numbers and freezes a draft, status `sent` (replaced `mark-sent`) |
| POST | `/finances/invoices/:id/void` | Sent invoices only |
| GET | `/finances/invoices/:id/document` | F4: the frozen data the PDF is drawn from |
| GET / PUT | `/finances/business-profile` | F4: your details for invoices |
| POST | `/finances/invoices/:id/mark-paid` | `{ paidDate, amountMinor }` → creates the income transaction |
| POST | `/finances/invoices/:id/mark-unpaid` | Deletes the linked transaction |
| GET / PATCH | `/finances/settings` | Defaults on Settings › Finances |
| — | `/photos/*` (existing) | Attachments: same upload-url → PUT to B2 → create flow with `ownerType: finance_invoice \| finance_transaction`; invoice and transaction responses include an `attachments` count, detail responses the list |
| GET / POST / PATCH / DELETE | `/finances/recurring[/:id]` | Phase F3 |
| POST | `/finances/recurring/:id/confirm` · `/skip` | Phase F3: confirm books the transaction for this month; both set `last_handled_month` |
| GET | `/finances/export.csv?year&type=transactions\|invoices` | Phase F3 |

Error codes (typed contract): `finances.invoice_number_taken`, `finances.invoice_already_paid`, `finances.invoice_not_paid`, `finances.category_in_use`, `finances.client_in_use`.

## Screens

Every screen below has an artboard on the [design canvas](https://claude.ai/artifact/MssgjHtjxpUoKie1rvC5wt); the number is its artboard title (e.g. "2.3 Desktop — Client detail"). Build from the artboard, follow `docs/DESIGN-LANGUAGE.md` where they differ.

**Navigation.** The sidebar gains a module switch: **Garage** and **Finances** are top-level groups, the active one expanded with its pages (Overview · Transactions · Invoices · Clients; Invoices shows the overdue count in `destructive`). Phones: the bottom bar becomes Garage / Finances / Reminders / Settings.

### Pages

| # | Screen | Route | Content | Phase |
| --- | --- | --- | --- | --- |
| 1.1 | **Overview** | `/finances?range=12m` · `?year=` · `?from=&to=` · `&category=&client=` | Defaults to **all time**; a filter row (period: All time · Last 12 months · a year · Custom range…, category, client, Clear) narrows the figures and charts only. KPI strip: Earned (vs the period before, or "since …" for all time) · Spent (other currencies as a second line) · Net (monthly average) · Waiting for payment (overdue part in `destructive`; never filtered). "To confirm" band for recurring income (Confirm / Skip). "Waiting for payment" rows with hover "Mark paid `P`". Income vs spending bars per bucket with y-axis and hover tooltip (in · out · net); a bar opens its transactions. "Where the money went": top categories with share % and a trend line, Car costs from Garage (links out); a category opens its transactions for the period. Highlights: earned a month (spent hint), kept of income, best and worst month. Recent 5 transactions. | F2 (salary band F3) |
| 1.2 | **Transactions** | `/finances/transactions` | Filters in the URL: kind (segmented), category, client, year (or a `from`/`to` range from the overview, shown as a removable chip), search. Rows grouped by month; the band shows count, in, out and net. Row: icon, description, category dot, client, date, amount (income in `success`). Hover: duplicate, ⋯ menu (edit, delete). Footer: "Showing n of m" + Load more (cursor paging). | F1 |
| 2.1 | **Invoices** | `/finances/invoices` | Stat strip: invoiced this year · paid · unpaid (bar split not-due / overdue) · avg. days to get paid. Filters: All / Unpaid / Paid, client, year. Column header row. Groups Overdue · Sent · Draft · Paid in {year}, each with its total. A paperclip after the description when files are attached. Hover/focus row: "Mark paid" + ⋯; drafts offer "Send". Keyboard focus shows an accent edge; `P` marks the focused row paid. | F2 |
| 2.2 | **Clients** | `/finances/clients` | Columns: name + one-line note, kind tag (Client / Employer), terms, earned this year, unpaid (late in `destructive`), last invoice. Active and Archived groups. "Share of income" stacked bar. | F2 |
| 2.3 | **Client detail** | `/finances/clients/$clientId` | Header (monogram, since, currency, terms), stat strip (this year · all time · unpaid · usually pays after), invoices list, earned per month, details aside (kind, currency, terms, email, notes), Archive. Actions: Edit, New invoice (prefilled with this client). | F2 |
| 4.1 | **Settings › Finances** | `/settings/finances` | Defaults: main currency (= `user_preferences.currency`), payment terms, invoice number format, overdue reminders on/off. Expense and income categories (drag to reorder, ⋯ rename/archive, entry counts; "Invoices" is a system category). Recurring income (F3). Export CSV per year (F3). | F1 categories, F2 defaults, F3 rest |

### Dialogs (`?dialog=transaction|invoice|client|mark-paid`, plus `id` for edit)

| # | Dialog | Content |
| --- | --- | --- |
| 3.1 | **Log expense** | Expense / Income toggle (expense default), big amount + currency, description, note, chips for category, date (Today), receipt photo; "Frequent" category shortcuts. Save `⌘↵`. |
| 3.2 | **Log income** | Same dialog on Income: amount prefixed `+€`, category + client chips. If the chosen client has unpaid invoices, a hint links to "Mark {number} paid" instead, so invoice money isn't logged twice. |
| 3.3 | **New / edit invoice** | Client (fills currency, terms, due date), number (suggested, "Next after …"), work period, issue date, due date (+ terms hint), description, amount, currency, **Files** (drop zone "Drop the invoice PDF or browse", uploaded files listed with name, size, remove; upload progress inline), notes. Footer: Save as draft · Save & mark sent `⌘↵`. |
| 3.4 | **Paid invoice** | Read-only: amount, Paid badge, dates (days to get paid), description, link to the ledger entry, **Files** (open in new tab, add more), history (created → sent → paid), lock notice. Footer: Delete · Mark unpaid · Duplicate for next month (opens 3.3 prefilled, period + 1 month, next number; files are not copied). |
| 3.5 | **Mark paid** | Amount received (prefilled), Paid today / Yesterday, preview of the ledger entry it adds and how late it was. |
| 3.6 | **New / edit client** | Name (server error shown on the field), kind (Client · I send invoices / Employer · pays a salary), currency, terms, billing email, notes. |
| 4.2 | **⌘K** | Scoped to Finances on finance pages: actions (New invoice `I`, Mark invoice paid… `P`, Export CSV, Log expense `T`, Log income), matching invoices with status and amount, Go to pages. |

### States (4.3)

- **Empty**: first visit (Add client · Log transaction) and filter-with-no-results ("Nothing unpaid").
- **Confirm**: delete (destructive button, mentions Undo) and mark unpaid (says which ledger entry goes away).
- **Toasts**: success with View, delete with Undo, error from the typed error code (e.g. `finances.invoice_number_taken`).
- **Push** (F3): one heads-up per invoice the day after it becomes overdue; tap opens Mark paid.
- **Loading** skeleton rows and **error** with Retry, as in the design language.

### Mobile (5.x)

| # | Screen | Content |
| --- | --- | --- |
| 5.1 | **Finances home** | Large title + one-line status, quick actions (Expense · Income · Invoice), net-this-year card with bars, salary to confirm (F3), waiting for payment, recent. |
| 5.2 | **Transactions** | Filter chips (scroll), month groups with net, swipe left to delete (then Undo toast). |
| 5.3 | **Invoices** | All / Unpaid / Paid segmented, status groups, "Mark paid" on overdue rows. |
| 5.4 | **Log transaction sheet** | Bottom sheet version of 3.1/3.2: toggle, large centred amount, category chips, For / Date / Receipt rows, full-width Save. |

Status shapes: draft = dashed ring, sent = ring, overdue = solid "!" disc, paid = check disc, void = struck-through grey.

Shortcuts on finance pages: `T` log transaction, `I` new invoice; on Invoices `P` marks the focused row paid.

## Phases

Each phase is one branch and PR, `pnpm check` green, seeders extended (`src/worker/db/seed/`) so the demo shows the feature.

1. **F1 — Ledger**: categories (with seeded defaults), transactions CRUD, Transactions page, Log transaction dialog, sidebar module switch.
2. **F2 — Work**: clients, invoices with status flow and mark paid/unpaid, Invoices and Clients pages, Overview page with `GET /finances/overview`, attachments (invoice PDFs + transaction receipts, PDF support in the photo pipeline).
3. **F3 — Extras**: recurring income (salary) with a "Confirm this month's salary" row on the overview, projects, overdue-invoice push heads-up via the daily cron, CSV export.
4. **F4 — Invoice documents** (built): business profile, per-year numbering with gap-free issuing, itemised invoices, PDF generation. Spec: `docs/INVOICE-DOCUMENTS-SPEC.md`.

## Out of scope

Bank sync, budgets, tax calculations, live exchange rates (rates are entered by hand), importing the existing spreadsheet (entered by hand), multi-user splitting.

## Open questions

- Track tax withheld / net per invoice? (Could add an optional `tax_minor` later without changing the flow.)
- Should income from salary be a client of kind `employer`, or a separate "Employer" concept? Spec assumes the former.
