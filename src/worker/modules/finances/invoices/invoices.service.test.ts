import { NO_RATES } from "@shared/domain/exchange";
import type { InvoiceNumberFormat } from "@shared/domain/finances/invoices";
import { describe, expect, it } from "vitest";

import type { ClientRow } from "../clients/clients.repository";
import type {
  InvoicesRepositoryPort,
  InvoiceWithClient,
} from "./invoices.repository";
import { InvoicesService } from "./invoices.service";
import type { InvoiceInput } from "./invoices.service";

const NOW = new Date("2026-11-20T09:00:00Z");
const TODAY = "2026-11-20";

const CLIENT: ClientRow = {
  address: "Main St 1\nBerlin",
  archivedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  currency: "EUR",
  email: "billing@northwind.example",
  householdId: "h1",
  id: "client-1",
  invoiceLanguage: "en",
  kind: "client",
  name: "Northwind Labs",
  notes: null,
  paymentTermsDays: 30,
  taxId: "DE123",
  updatedAt: "2026-01-01T00:00:00Z",
};

const INPUT: InvoiceInput = {
  amountMinor: 480_000,
  clientId: CLIENT.id,
  currency: "EUR",
  description: "Software development",
  dueDate: "2026-12-20",
  issueDate: TODAY,
  notes: null,
  periodEnd: null,
  periodStart: null,
  projectId: null,
};

interface FakeInvoices extends InvoicesRepositoryPort {
  rows: InvoiceWithClient[];
  /** Makes the next write fail like a unique index would. */
  failNextWrite: () => void;
}

const fakeInvoices = (): FakeInvoices => {
  const rows: InvoiceWithClient[] = [];
  let failWrite = false;

  const live = () => rows.filter((row) => row.deletedAt === null);

  const guard = () => {
    if (failWrite) {
      failWrite = false;
      throw new Error("D1_ERROR: UNIQUE constraint failed: finance_invoices");
    }
  };

  // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
  return {
    deletedBefore: async () => await Promise.resolve([]),
    failNextWrite: () => {
      failWrite = true;
    },
    findById: async (id, options) =>
      await Promise.resolve(
        (options?.includeDeleted === true ? rows : live()).find(
          (row) => row.id === id
        )
      ),
    insert: async (values) => {
      guard();

      const row: InvoiceWithClient = {
        clientName: CLIENT.name,
        clientSnapshot: null,
        createdAt: NOW.toISOString(),
        deletedAt: null,
        householdId: "h1",
        id: crypto.randomUUID(),
        issuedAt: null,
        issuerSnapshot: null,
        number: null,
        numberSeq: null,
        numberYear: null,
        overdueNotifiedAt: null,
        paidAt: null,
        projectName: null,
        sentAt: null,
        status: "draft",
        updatedAt: NOW.toISOString(),
        voidedAt: null,
        ...values,
        description: values.description ?? null,
        notes: values.notes ?? null,
        periodEnd: values.periodEnd ?? null,
        periodStart: values.periodStart ?? null,
        projectId: values.projectId ?? null,
      };

      rows.push(row);

      return await Promise.resolve(row);
    },
    list: async () => await Promise.resolve(live()),
    markNotified: async () => {
      await Promise.resolve();
    },
    numberTaken: async (number, exceptId) =>
      await Promise.resolve(
        live().some((row) => row.number === number && row.id !== exceptId)
      ),
    numbered: async (year) =>
      await Promise.resolve(
        live()
          .filter(
            (row) =>
              row.numberSeq !== null &&
              (year === null || row.numberYear === year)
          )
          .toSorted((a, b) => (b.numberSeq ?? 0) - (a.numberSeq ?? 0))
          .map((row) => ({ number: row.number ?? "", seq: row.numberSeq ?? 0 }))
      ),
    purge: async () => {
      await Promise.resolve();
    },
    rows,
    seqTaken: async (year, seq, exceptId) =>
      await Promise.resolve(
        live().some(
          (row) =>
            row.numberSeq === seq &&
            (year === null || row.numberYear === year) &&
            row.id !== exceptId
        )
      ),
    setDeleted: async (id, deletedAt) => {
      for (const row of rows) {
        if (row.id === id) {
          row.deletedAt = deletedAt;
        }
      }

      await Promise.resolve();
    },
    update: async (id, patch) => {
      guard();

      for (const [index, row] of rows.entries()) {
        if (row.id === id) {
          rows[index] = { ...row, ...patch };
        }
      }

      await Promise.resolve();
    },
  };
};

const setup = (
  options: { format?: InvoiceNumberFormat; profile?: boolean } = {}
) => {
  const repo = fakeInvoices();

  const profile = {
    address: "Ulica 1",
    bankName: null,
    companyId: null,
    defaultVatRateBp: 0,
    email: null,
    footerNote: null,
    iban: "MK07",
    name: "Jane Dev",
    phone: null,
    swift: null,
    taxId: null,
    vatRegistered: false,
  };

  // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
  const service = new InvoicesService({
    attachments: {
      countByOwner: async () => await Promise.resolve(new Map()),
      firstAttachedAt: async () => await Promise.resolve(null),
    },
    businessProfile: {
      get: async () =>
        await Promise.resolve(options.profile === false ? null : profile),
      issuerSnapshot: async () => {
        const { defaultVatRateBp: _rate, ...snapshot } = profile;

        return await Promise.resolve(snapshot);
      },
    },
    categories: {
      invoicesCategory: async () => await Promise.reject(new Error("unused")),
    },
    clients: { requireForEntry: async () => await Promise.resolve(CLIENT) },
    clock: { now: () => NOW, today: async () => await Promise.resolve(TODAY) },
    household: {
      preferences: async () =>
        await Promise.resolve({
          currency: "EUR" as const,
          locale: "en" as const,
          timeZone: "Europe/Skopje",
        }),
    },
    projects: {
      requireForInvoice: async () =>
        await Promise.reject(new Error("no projects in these tests")),
    },
    repo,
    settings: {
      get: async () =>
        await Promise.resolve({
          defaultPaymentTermsDays: 30,
          exchangeRates: NO_RATES,
          invoiceNumberFormat: options.format ?? "YYYY-NNN",
          overdueReminders: true,
        }),
    },
    transactions: {
      deleteByInvoice: async () => {
        await Promise.resolve();
      },
      findByInvoice: async () => {
        await Promise.resolve(undefined);
      },
      insertForInvoice: async () => await Promise.reject(new Error("unused")),
      setDeletedByInvoice: async () => {
        await Promise.resolve();
      },
    },
  });

  return { repo, service };
};

const codeOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error instanceof Error && "code" in error ? error.code : "thrown";
  }

  return "resolved";
};

describe(InvoicesService, () => {
  it("saves drafts without a number and numbers them in order when issued", async () => {
    const { repo, service } = setup();
    const { id: first } = await service.create(INPUT, null);
    const { id: second } = await service.create(INPUT, null);

    expect(repo.rows.map((row) => row.number)).toStrictEqual([null, null]);

    await expect(service.issue(second, null)).resolves.toBe("2026-001");
    await expect(service.issue(first, null)).resolves.toBe("2026-002");
    expect(repo.rows[0]).toMatchObject({
      clientSnapshot: {
        language: "en",
        name: "Northwind Labs",
        taxId: "DE123",
      },
      issuedAt: NOW.toISOString(),
      issuerSnapshot: { name: "Jane Dev" },
      numberSeq: 2,
      numberYear: 2026,
      sentAt: TODAY,
      status: "sent",
    });
  });

  it("continues after plain legacy numbers and suggests the next one", async () => {
    const { service } = setup();
    await service.create(INPUT, { number: "011" });

    await expect(service.nextNumber(2026)).resolves.toStrictEqual({
      number: "2026-012",
      previous: "011",
    });
    await expect(service.nextNumber(2027)).resolves.toStrictEqual({
      number: "2027-001",
      previous: null,
    });
  });

  it("counts across years with the NNN format", async () => {
    const { service } = setup({ format: "NNN" });
    await service.create(
      { ...INPUT, issueDate: "2025-12-30" },
      { number: "041" }
    );

    await expect(
      service.create(INPUT, { number: null })
    ).resolves.toMatchObject({ number: "042" });
    await expect(service.nextNumber()).resolves.toStrictEqual({
      number: "043",
      previous: "042",
    });
  });

  it("refuses numbers that don't parse, belong to another year or are taken", async () => {
    const { service } = setup();
    await service.create(INPUT, { number: "2026-005" });

    await expect(
      codeOf(service.create(INPUT, { number: "INV 7" }))
    ).resolves.toBe("finances.invoice_number_invalid");
    await expect(
      codeOf(service.create(INPUT, { number: "2025-006" }))
    ).resolves.toBe("finances.invoice_number_invalid");
    await expect(
      codeOf(service.create(INPUT, { number: "005" }))
    ).resolves.toBe("finances.invoice_number_taken");
  });

  it("reports a number grabbed by a parallel issue as taken", async () => {
    const { repo, service } = setup();
    const { id: draft } = await service.create(INPUT, null);
    repo.failNextWrite();

    await expect(codeOf(service.issue(draft, null))).resolves.toBe(
      "finances.invoice_number_taken"
    );
  });

  it("issues recorded invoices without a profile, keeping no issuer copy", async () => {
    const { repo, service } = setup({ profile: false });
    await service.create(INPUT, { number: "011" });

    expect(repo.rows[0]).toMatchObject({ issuerSnapshot: null, number: "011" });
  });

  it("locks issued invoices except notes, and voids instead of deleting", async () => {
    const { repo, service } = setup();
    const { id } = await service.create(INPUT, { number: null });

    await expect(codeOf(service.update(id, { amountMinor: 1 }))).resolves.toBe(
      "finances.invoice_issued"
    );
    await expect(codeOf(service.issue(id, null))).resolves.toBe(
      "finances.invoice_issued"
    );
    await expect(codeOf(service.delete(id))).resolves.toBe(
      "finances.invoice_issued"
    );

    await service.update(id, { notes: "Thanks!" });
    await service.markVoid(id);

    expect(repo.rows[0]).toMatchObject({
      notes: "Thanks!",
      number: "2026-001",
      status: "void",
      voidedAt: NOW.toISOString(),
    });
    await expect(service.nextNumber()).resolves.toMatchObject({
      number: "2026-002",
    });
  });

  it("deletes drafts but won't void or mark them paid", async () => {
    const { repo, service } = setup();
    const { id } = await service.create(INPUT, null);

    await expect(codeOf(service.markVoid(id))).resolves.toBe(
      "finances.invoice_not_issued"
    );
    await expect(
      codeOf(service.markPaid(id, { amountMinor: 1, paidDate: TODAY }))
    ).resolves.toBe("finances.invoice_not_issued");

    await service.delete(id);

    expect(repo.rows[0]?.deletedAt).toBe(NOW.toISOString());
  });
});
