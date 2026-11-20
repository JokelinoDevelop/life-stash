import type { ExchangeRates } from "@shared/domain/exchange";
import { INVOICE_LANGUAGES } from "@shared/domain/finances/invoice-document";
import type {
  InvoiceClientSnapshot,
  InvoiceIssuerSnapshot,
} from "@shared/domain/finances/invoice-document";
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

import { households } from "./core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const now = () => new Date().toISOString();

const createdAt = () => text("created_at").notNull().$defaultFn(now);

const timestamps = {
  createdAt: createdAt(),
  updatedAt: text("updated_at").notNull().$defaultFn(now).$onUpdateFn(now),
};

const householdId = () =>
  text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" });

const currency = (name: string) => text(name, { enum: ["MKD", "EUR", "USD"] });

const transactionKind = () =>
  text("kind", { enum: ["income", "expense"] }).notNull();

export const financeCategories = sqliteTable(
  "finance_categories",
  {
    archivedAt: text("archived_at"),
    createdAt: createdAt(),
    householdId: householdId(),
    /** A lucide icon name from `CATEGORY_ICONS`. */
    icon: text("icon"),
    id: id(),
    kind: transactionKind(),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    /** Set on categories the app relies on (`invoices`); those can't be changed or removed. */
    systemKey: text("system_key", { enum: ["invoices"] }),
  },
  (table) => [
    index("finance_categories_household_idx").on(table.householdId, table.kind),
  ]
);

export const financeClients = sqliteTable(
  "finance_clients",
  {
    ...timestamps,
    /** Billing address (multi-line), printed under "Bill to". */
    address: text("address"),
    archivedAt: text("archived_at"),
    currency: currency("currency").notNull(),
    email: text("email"),
    householdId: householdId(),
    id: id(),
    /** The language their invoices are written in. */
    invoiceLanguage: text("invoice_language", { enum: INVOICE_LANGUAGES })
      .notNull()
      .default("en"),
    kind: text("kind", { enum: ["client", "employer"] }).notNull(),
    name: text("name").notNull(),
    notes: text("notes"),
    paymentTermsDays: integer("payment_terms_days").notNull().default(30),
    taxId: text("tax_id"),
  },
  (table) => [index("finance_clients_household_idx").on(table.householdId)]
);

export const financeProjects = sqliteTable(
  "finance_projects",
  {
    ...timestamps,
    clientId: text("client_id")
      .notNull()
      .references(() => financeClients.id),
    householdId: householdId(),
    id: id(),
    name: text("name").notNull(),
    notes: text("notes"),
    status: text("status", { enum: ["active", "done"] })
      .notNull()
      .default("active"),
  },
  (table) => [
    index("finance_projects_client_idx").on(table.householdId, table.clientId),
  ]
);

export const financeInvoices = sqliteTable(
  "finance_invoices",
  {
    ...timestamps,
    amountMinor: integer("amount_minor").notNull(),
    clientId: text("client_id")
      .notNull()
      .references(() => financeClients.id),
    /** The client's billing details, frozen when the invoice is issued. */
    clientSnapshot: text("client_snapshot", {
      mode: "json",
    }).$type<InvoiceClientSnapshot>(),
    currency: currency("currency").notNull(),
    /** Soft delete for Undo (drafts only); purged by the daily cron after 7 days. */
    deletedAt: text("deleted_at"),
    description: text("description"),
    dueDate: text("due_date").notNull(),
    householdId: householdId(),
    id: id(),
    issueDate: text("issue_date").notNull(),
    /** When it was issued (ISO timestamp); drafts have none. */
    issuedAt: text("issued_at"),
    /** Your business profile, frozen when the invoice is issued. */
    issuerSnapshot: text("issuer_snapshot", {
      mode: "json",
    }).$type<InvoiceIssuerSnapshot>(),
    notes: text("notes"),
    /** The number as the client received it; null while a draft. */
    number: text("number"),
    /** The parsed sequence and its year (plain legacy numbers use the issue year). */
    numberSeq: integer("number_seq"),
    numberYear: integer("number_year"),
    /** When the one overdue push heads-up went out (cleared when the due date moves). */
    overdueNotifiedAt: text("overdue_notified_at"),
    /** The day the money arrived (YYYY-MM-DD), set by "mark paid". */
    paidAt: text("paid_at"),
    periodEnd: text("period_end"),
    periodStart: text("period_start"),
    projectId: text("project_id").references(() => financeProjects.id),
    /** The day it was marked sent (YYYY-MM-DD). */
    sentAt: text("sent_at"),
    status: text("status", { enum: ["draft", "sent", "paid", "void"] })
      .notNull()
      .default("draft"),
    /** When it was voided (ISO timestamp). */
    voidedAt: text("voided_at"),
  },
  (table) => [
    uniqueIndex("finance_invoices_number_idx")
      .on(table.householdId, table.number)
      .where(sql`${table.deletedAt} IS NULL AND ${table.number} IS NOT NULL`),
    uniqueIndex("finance_invoices_seq_idx")
      .on(table.householdId, table.numberYear, table.numberSeq)
      .where(
        sql`${table.deletedAt} IS NULL AND ${table.numberSeq} IS NOT NULL`
      ),
    index("finance_invoices_client_idx").on(table.householdId, table.clientId),
  ]
);

/** Your details for invoices (one row per household, created on first save). */
export const financeBusinessProfile = sqliteTable("finance_business_profile", {
  address: text("address").notNull().default(""),
  bankName: text("bank_name"),
  companyId: text("company_id"),
  /** Basis points: 1800 = 18%. */
  defaultVatRateBp: integer("default_vat_rate_bp").notNull().default(0),
  email: text("email"),
  /** Printed at the bottom of every invoice, e.g. "Not a VAT payer". */
  footerNote: text("footer_note"),
  householdId: text("household_id")
    .primaryKey()
    .references(() => households.id, { onDelete: "cascade" }),
  iban: text("iban"),
  name: text("name").notNull(),
  phone: text("phone"),
  swift: text("swift"),
  taxId: text("tax_id"),
  updatedAt: text("updated_at").notNull().$defaultFn(now).$onUpdateFn(now),
  vatRegistered: integer("vat_registered", { mode: "boolean" })
    .notNull()
    .default(false),
});

export const financeSettings = sqliteTable("finance_settings", {
  defaultPaymentTermsDays: integer("default_payment_terms_days")
    .notNull()
    .default(30),
  /** Hand-entered rates for showing totals in the main currency; null until set. */
  exchangeRates: text("exchange_rates", {
    mode: "json",
  }).$type<ExchangeRates>(),
  householdId: text("household_id")
    .primaryKey()
    .references(() => households.id, { onDelete: "cascade" }),
  invoiceNumberFormat: text("invoice_number_format", {
    enum: ["YYYY-NNN", "YYYY/NNN", "NNN"],
  })
    .notNull()
    .default("YYYY-NNN"),
  overdueReminders: integer("overdue_reminders", { mode: "boolean" })
    .notNull()
    .default(true),
  updatedAt: text("updated_at").notNull().$defaultFn(now).$onUpdateFn(now),
});

export const financeRecurring = sqliteTable(
  "finance_recurring",
  {
    ...timestamps,
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    amountMinor: integer("amount_minor").notNull(),
    categoryId: text("category_id")
      .notNull()
      .references(() => financeCategories.id),
    clientId: text("client_id").references(() => financeClients.id),
    currency: currency("currency").notNull(),
    /** 1–31; months without that day use their last day. */
    dayOfMonth: integer("day_of_month").notNull(),
    description: text("description").notNull(),
    householdId: householdId(),
    id: id(),
    kind: transactionKind(),
    /** `YYYY-MM` last confirmed or skipped; the overview asks again next month. */
    lastHandledMonth: text("last_handled_month"),
  },
  (table) => [index("finance_recurring_household_idx").on(table.householdId)]
);

export const financeTransactions = sqliteTable(
  "finance_transactions",
  {
    ...timestamps,
    /** Always positive; `kind` says which way the money went. */
    amountMinor: integer("amount_minor").notNull(),
    categoryId: text("category_id")
      .notNull()
      .references(() => financeCategories.id),
    /** Who paid (income only). */
    clientId: text("client_id").references(() => financeClients.id),
    currency: currency("currency").notNull(),
    date: text("date").notNull(),
    /** Soft delete, so a delete can be undone; the daily cron purges rows after 7 days. */
    deletedAt: text("deleted_at"),
    description: text("description").notNull(),
    householdId: householdId(),
    id: id(),
    /** Set when "mark paid" created this income; at most one per invoice. */
    invoiceId: text("invoice_id").references(() => financeInvoices.id),
    kind: transactionKind(),
    notes: text("notes"),
    /** Set when confirmed from a recurring income template. */
    recurringId: text("recurring_id"),
  },
  (table) => [
    uniqueIndex("finance_transactions_invoice_idx")
      .on(table.invoiceId)
      .where(sql`${table.invoiceId} IS NOT NULL`),
    index("finance_transactions_date_idx").on(table.householdId, table.date),
    index("finance_transactions_category_idx").on(
      table.householdId,
      table.categoryId
    ),
    index("finance_transactions_deleted_idx")
      .on(table.deletedAt)
      .where(sql`${table.deletedAt} IS NOT NULL`),
  ]
);
