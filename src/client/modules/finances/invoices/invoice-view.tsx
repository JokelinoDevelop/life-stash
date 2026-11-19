import { daysToGetPaid } from "@shared/domain/finances/invoices";
import { Check, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { FormNotice } from "@/components/form/dialog-form";
import { Button } from "@/components/ui/button";
import { useFormat } from "@/lib/format";
import { useConfig } from "@/lib/session";

import { FileList } from "../attachments/file-list";
import { useCategoryName } from "../categories/category-label";
import { useFinanceDialog } from "../dialogs/use-finance-dialog";
import { useLedgerMoney } from "../money";
import { useInvoiceFor } from "./invoice-labels";
import type { InvoiceDetail } from "./invoices.queries";
import { useInvoiceActions } from "./use-invoice-actions";

const Row = ({ children, label }: { children: ReactNode; label: string }) => (
  <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-1.5 text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="min-w-0 tabular-nums">{children}</dd>
  </div>
);

/** History, newest first: paid, sent, files attached, created. */
const History = ({ invoice }: { invoice: InvoiceDetail }) => {
  const { t } = useTranslation("finances");
  const format = useFormat();

  const events = [
    invoice.paidAt === null
      ? null
      : { at: invoice.paidAt, label: t("invoices.view.markedPaid") },
    invoice.sentAt === null
      ? null
      : { at: invoice.sentAt, label: t("invoices.view.markedSent") },
    invoice.firstAttachedAt === null
      ? null
      : {
          at: invoice.firstAttachedAt.slice(0, 10),
          label: t("invoices.view.attached"),
        },
    { at: invoice.createdAt.slice(0, 10), label: t("invoices.view.created") },
  ].filter((event) => event !== null);

  return (
    <ol className="flex flex-col gap-2 text-sm">
      {events.map((event, index) => (
        <li className="flex items-center gap-2.5" key={event.label}>
          <span
            aria-hidden="true"
            className={
              index === 0
                ? "bg-success size-2 rounded-full"
                : "bg-border size-2 rounded-full"
            }
          />
          <span>{event.label}</span>
          <span className="text-muted-foreground tabular-nums">
            · {format.date(event.at)}
          </span>
        </li>
      ))}
    </ol>
  );
};

/** A paid invoice, read-only (3.4): Delete · Mark unpaid · Duplicate for next month. */
export const InvoiceView = ({
  invoice,
  onClose,
}: {
  invoice: InvoiceDetail;
  onClose: () => Promise<void>;
}) => {
  const { t } = useTranslation("finances");
  const format = useFormat();
  const ledger = useLedgerMoney();
  const forLabel = useInvoiceFor();
  const nameOf = useCategoryName();
  const dialog = useFinanceDialog();
  const actions = useInvoiceActions();
  const photos = useConfig().data?.photosEnabled === true;
  const amount = ledger.money(invoice.amountMinor, invoice.currency);
  const paidAt = invoice.paidAt ?? invoice.issueDate;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="divide-divider min-h-0 flex-1 divide-y overflow-y-auto">
        <section className="flex flex-col gap-1 px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">
              {amount}
            </span>
            <span className="bg-success/15 text-success-foreground inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-medium">
              <Check aria-hidden="true" className="size-3" />
              {t("invoices.status.paid")}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            {invoice.clientName} · {forLabel(invoice)}
          </p>
          <dl className="mt-3">
            <Row label={t("invoices.view.issued")}>
              {format.date(invoice.issueDate)}
            </Row>
            <Row label={t("invoices.view.due")}>
              {format.date(invoice.dueDate)}
            </Row>
            <Row label={t("invoices.view.paid")}>
              {t("invoices.view.paidAfter", {
                count: daysToGetPaid(invoice.issueDate, paidAt),
                date: format.date(paidAt),
              })}
            </Row>
            {invoice.description !== null && (
              <Row label={t("invoices.view.description")}>
                {invoice.description}
              </Row>
            )}
            {invoice.transaction !== null && (
              <Row label={t("invoices.view.inLedger")}>
                {ledger.signed(
                  invoice.transaction.amountMinor,
                  invoice.transaction.currency,
                  "income"
                )}{" "}
                · {nameOf({ name: "", systemKey: "invoices" })} ·{" "}
                {format.date(invoice.transaction.date)}
              </Row>
            )}
          </dl>
        </section>
        {photos && (
          <section className="flex flex-col gap-2 px-4 py-4">
            <h3 className="text-subtle-foreground text-xs font-medium">
              {t("invoices.files.title")}
            </h3>
            <FileList
              owner={{ ownerId: invoice.id, ownerType: "finance_invoice" }}
            />
          </section>
        )}
        <section className="flex flex-col gap-2 px-4 py-4">
          <h3 className="text-subtle-foreground text-xs font-medium">
            {t("invoices.view.history")}
          </h3>
          <History invoice={invoice} />
        </section>
        <FormNotice icon={<Lock />}>{t("invoices.view.locked")}</FormNotice>
      </div>
      <div className="border-divider pb-safe flex shrink-0 flex-wrap items-center gap-2 border-t px-3 py-2.5">
        <Button
          onClick={async () => {
            if (await actions.remove(invoice, amount)) {
              await onClose();
            }
          }}
          size="compact"
          variant="ghost"
        >
          {t("invoices.deleteConfirm")}
        </Button>
        <span className="flex-1" />
        <Button
          onClick={async () => {
            await actions.markUnpaid(invoice);
          }}
          size="compact"
          variant="outline"
        >
          {t("invoices.unpaidConfirm")}
        </Button>
        <Button
          onClick={() => {
            void dialog.open({ dialog: "invoice", duplicate: invoice.id });
          }}
          size="compact"
          variant="outline"
        >
          {t("invoices.duplicate")}
        </Button>
      </div>
    </div>
  );
};
