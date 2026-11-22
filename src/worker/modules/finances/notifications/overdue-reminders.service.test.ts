import { NO_RATES } from "@shared/domain/exchange";
import { describe, expect, it } from "vitest";

import type { PushMessage } from "../../../core/push";
import type { InvoiceWithClient } from "../invoices/invoices.repository";
import { OverdueRemindersService } from "./overdue-reminders.service";

const invoice = (overrides: Partial<InvoiceWithClient>): InvoiceWithClient => ({
  amountMinor: 320_000,
  clientId: "c1",
  clientName: "Brightside Studio",
  clientSnapshot: null,
  createdAt: "2026-10-21T10:00:00Z",
  currency: "EUR",
  deletedAt: null,
  description: null,
  dueDate: "2026-11-05",
  householdId: "h1",
  id: crypto.randomUUID(),
  issueDate: "2026-10-22",
  issuedAt: "2026-10-22T10:00:00Z",
  issuerSnapshot: null,
  notes: null,
  number: "2026-013",
  numberSeq: 13,
  numberYear: 2026,
  overdueNotifiedAt: null,
  paidAt: null,
  periodEnd: null,
  periodStart: null,
  projectId: null,
  projectName: null,
  purchaseOrder: null,
  sentAt: "2026-10-22",
  shippingMinor: 0,
  status: "sent",
  updatedAt: "2026-10-22T10:00:00Z",
  voidedAt: null,
  ...overrides,
});

const setup = (rows: InvoiceWithClient[], overdueReminders = true) => {
  const sent: PushMessage[] = [];
  const notified: string[] = [];

  const service = new OverdueRemindersService({
    clock: {
      now: () => new Date("2026-11-19T08:00:00Z"),
      today: async () => await Promise.resolve("2026-11-19"),
    },
    household: {
      preferences: async () =>
        await Promise.resolve({
          currency: "EUR" as const,
          locale: "en" as const,
          timeZone: "UTC",
        }),
    },
    invoices: {
      list: async () => await Promise.resolve(rows),
      markNotified: async (ids) => {
        notified.push(...ids);
        await Promise.resolve();
      },
    },
    send: async (message) => {
      sent.push(message);
      await Promise.resolve();
    },
    settings: {
      get: async () =>
        await Promise.resolve({
          defaultPaymentTermsDays: 30,
          exchangeRates: NO_RATES,
          invoiceNumberFormat: "YYYY-NNN" as const,
          overdueReminders,
        }),
    },
  });

  return { notified, sent, service };
};

describe(OverdueRemindersService, () => {
  it("sends one heads-up per newly overdue invoice and records it", async () => {
    const late = invoice({});
    const told = invoice({ overdueNotifiedAt: "2026-11-06T08:00:00Z" });

    const { notified, sent, service } = setup([
      late,
      told,
      invoice({ dueDate: "2026-11-30" }),
    ]);

    await service.run();

    expect(notified).toStrictEqual([late.id]);
    expect(sent).toStrictEqual([
      {
        body: "2026-013 for Brightside Studio (€3,200.00) was due 05.11. Tap to mark it paid.",
        tag: `invoice-overdue-${late.id}`,
        title: "Invoice overdue",
        url: `/finances/invoices?dialog=mark-paid&id=${late.id}`,
      },
    ]);
  });

  it("stays quiet when the household turned reminders off", async () => {
    const { sent, service } = setup([invoice({})], false);

    await expect(service.run()).resolves.toStrictEqual([]);
    expect(sent).toHaveLength(0);
  });
});
