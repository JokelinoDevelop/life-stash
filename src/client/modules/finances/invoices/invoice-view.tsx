import { daysToGetPaid } from "@shared/domain/finances/invoices";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { FormNotice } from "@/components/form/dialog-form";
import { Button } from "@/components/ui/button";
import { useFormat } from "@/lib/format";
import { useConfig } from "@/lib/session";
import { cn } from "@/lib/utils";

import { FileList } from "../attachments/file-list";
import { useCategoryName } from "../categories/category-label";
import { useFinanceDialog } from "../dialogs/use-finance-dialog";
import { useLedgerMoney } from "../money";
import { InvoiceNotesForm } from "./forms/invoice-notes-form/invoice-notes-form";
import { useInvoiceFor } from "./invoice-labels";
import { InvoiceStatusIcon } from "./invoice-status-icon";
import type { InvoiceDetail } from "./invoices.queries";
import { useInvoiceActions } from "./use-invoice-actions";

const Row = ({ children, label }: { children: ReactNode; label: string }) => (
  <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-1.5 text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="min-w-0 tabular-nums">{children}</dd>
  </div>
);

const Section = ({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) => (
  <section className="flex flex-col gap-2 px-4 py-4">
    {title !== undefined && (
      <h3 className="text-subtle-foreground text-xs font-medium">{title}</h3>
    )}
    {children}
  </section>
);

/** History, newest first: voided, paid, issued, files attached, created. */
const History = ({ invoice }: { invoice: InvoiceDetail }) => {
  const { t } = useTranslation("finances");
  const format = useFormat();
  const issuedOn = invoice.issuedAt?.slice(0, 10) ?? invoice.sentAt;

  const events = [
    invoice.voidedAt === null
      ? null
      : {
          at: invoice.voidedAt.slice(0, 10),
          label: t("invoices.view.markedVoid"),
        },
    invoice.paidAt === null
      ? null
      : { at: invoice.paidAt, label: t("invoices.view.markedPaid") },
    issuedOn === null
      ? null
      : { at: issuedOn, label: t("invoices.view.markedIssued") },
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
                ? "bg-foreground size-2 rounded-full"
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

/** Footer actions by status: void / mark paid (sent), mark unpaid (paid), duplicate (all). */
const ViewFooter = ({
  invoice,
  onClose,
}: {
  invoice: InvoiceDetail;
  onClose: () => Promise<void>;
}) => {
  const { t } = useTranslation("finances");
  const dialog = useFinanceDialog();
  const actions = useInvoiceActions();
  const unpaid = invoice.status === "sent" || invoice.status === "overdue";

  return (
    <div className="border-divider pb-safe-2.5 flex shrink-0 flex-wrap items-center gap-2 border-t px-3 pt-2.5">
      {unpaid && (
        <Button
          onClick={async () => {
            if (await actions.markVoid(invoice)) {
              await onClose();
            }
          }}
          size="compact"
          variant="ghost"
        >
          {t("invoices.void")}
        </Button>
      )}
      <span className="flex-1" />
      {invoice.status === "paid" && (
        <Button
          onClick={async () => {
            await actions.markUnpaid(invoice);
          }}
          size="compact"
          variant="outline"
        >
          {t("invoices.unpaidConfirm")}
        </Button>
      )}
      <Button
        onClick={() => {
          void dialog.open({ dialog: "invoice", duplicate: invoice.id });
        }}
        size="compact"
        variant={unpaid ? "outline" : "default"}
      >
        {t("invoices.duplicate")}
      </Button>
      {unpaid && (
        <Button
          onClick={() => {
            void dialog.open({ dialog: "mark-paid", id: invoice.id });
          }}
          size="compact"
        >
          {t("invoices.markPaid")}
        </Button>
      )}
    </div>
  );
};

/**
 * An issued invoice, read-only (3.4): what was sent, files, notes (editable until paid),
 * history. Paid ones are locked until marked unpaid.
 */
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
  const photos = useConfig().data?.photosEnabled === true;
  const amount = ledger.money(invoice.amountMinor, invoice.currency);
  const paid = invoice.status === "paid";
  const voided = invoice.status === "void";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="divide-divider min-h-0 flex-1 divide-y overflow-y-auto">
        <section className="flex flex-col gap-1 px-4 py-4">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-2xl font-semibold tracking-tight tabular-nums",
                voided && "text-muted-foreground line-through"
              )}
            >
              {amount}
            </span>
            <span className="text-subtle-foreground inline-flex items-center gap-1.5 text-sm">
              <InvoiceStatusIcon status={invoice.status} />
              {t(`invoices.status.${invoice.status}`)}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            {invoice.clientName} · {forLabel(invoice)}
          </p>
          <dl className="mt-3">
            <Row label={t("invoices.view.number")}>{invoice.number}</Row>
            <Row label={t("invoices.view.issued")}>
              {format.date(invoice.issueDate)}
            </Row>
            <Row label={t("invoices.view.due")}>
              {format.date(invoice.dueDate)}
            </Row>
            {paid && (
              <Row label={t("invoices.view.paid")}>
                {t("invoices.view.paidAfter", {
                  count: daysToGetPaid(
                    invoice.issueDate,
                    invoice.paidAt ?? invoice.issueDate
                  ),
                  date: format.date(invoice.paidAt ?? invoice.issueDate),
                })}
              </Row>
            )}
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
          <Section title={t("invoices.files.title")}>
            <FileList
              owner={{ ownerId: invoice.id, ownerType: "finance_invoice" }}
            />
          </Section>
        )}
        {paid ? (
          invoice.notes !== null && (
            <Section title={t("invoices.form.notes")}>
              <p className="text-sm whitespace-pre-line">{invoice.notes}</p>
            </Section>
          )
        ) : (
          <Section>
            <InvoiceNotesForm invoice={invoice} />
          </Section>
        )}
        <Section title={t("invoices.view.history")}>
          <History invoice={invoice} />
        </Section>
        <FormNotice icon={<Lock />}>
          {paid ? t("invoices.view.locked") : t("invoices.view.lockedIssued")}
        </FormNotice>
      </div>
      <ViewFooter invoice={invoice} onClose={onClose} />
    </div>
  );
};
