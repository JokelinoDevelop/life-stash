import { sumByCurrency } from "@shared/domain/money";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Archive, ArchiveRestore } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { AnimatedTotals } from "@/components/app/animated-number";
import { useConfirm } from "@/components/app/confirm/confirm-context";
import { ListRows } from "@/components/app/list-section";
import { Stat, StatPanel } from "@/components/app/stat-panel";
import { ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { useFormat } from "@/lib/format";
import { cn } from "@/lib/utils";

import { FinanceDialogLink } from "../dialogs/finance-dialog-link";
import {
  useDueLabel,
  useInvoiceFor,
  useInvoiceNumber,
} from "../invoices/invoice-labels";
import { InvoiceStatusIcon } from "../invoices/invoice-status-icon";
import { useLedgerMoney } from "../money";
import { ProjectsSection } from "../projects/projects-section";
import { useMonthLabel } from "../transactions/month-band";
import { ClientMonogram } from "./client-monogram";
import { useUpdateClient } from "./clients.mutations";
import { clientQuery } from "./clients.queries";
import type { ClientDetailBody } from "./clients.queries";
import { EarnedByMonth } from "./earned-by-month";

const INVOICE_PREVIEW = 6;

const Detail = ({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) => (
  <div className="flex flex-col gap-0.5">
    <dt className="text-muted-foreground text-xs">{label}</dt>
    <dd className="text-sm break-words">{children}</dd>
  </div>
);

const InvoicesList = ({ data }: { data: ClientDetailBody }) => {
  const { t } = useTranslation("finances");
  const format = useFormat();
  const ledger = useLedgerMoney();
  const dueLabel = useDueLabel();
  const forLabel = useInvoiceFor();
  const numberOf = useInvoiceNumber();

  const inYear = data.invoices.filter((invoice) =>
    invoice.issueDate.startsWith(`${data.year}-`)
  );

  const invoiced = inYear.filter(
    (invoice) => invoice.status !== "draft" && invoice.status !== "void"
  );

  return (
    <section className="flex flex-col gap-2 md:gap-0" data-bleed="">
      <div className="md:bg-background md:border-divider flex items-baseline gap-2 px-0.5 text-sm md:h-8 md:items-center md:border-b md:px-5 md:text-xs">
        <h2 className="text-subtle-foreground font-semibold md:font-medium">
          {t("clients.invoices")}
        </h2>
        <span className="text-muted-foreground tabular-nums">
          {t("clients.invoicesInYear", {
            count: inYear.length,
            year: data.year,
          })}
        </span>
        <span className="text-muted-foreground ml-auto hidden tabular-nums md:inline">
          {t("clients.invoicedTotal", {
            amount: format.totals(sumByCurrency(invoiced)),
          })}
        </span>
      </div>
      <ListRows>
        {data.invoices.length === 0 && (
          <li className="text-muted-foreground flex min-h-12 items-center px-3.5 text-sm md:px-5">
            {t("clients.noInvoicesYet")}
          </li>
        )}
        {data.invoices.slice(0, INVOICE_PREVIEW).map((invoice) => (
          <li
            className="hover:bg-background relative grid min-h-12 grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-3 px-3.5 md:min-h-10 md:grid-cols-[16px_72px_minmax(0,1fr)_84px_110px_96px] md:px-5"
            key={invoice.id}
          >
            <InvoiceStatusIcon status={invoice.status} />
            <span className="text-muted-foreground hidden tabular-nums md:block">
              {numberOf(invoice)}
            </span>
            <FinanceDialogLink
              className="truncate outline-none after:absolute after:inset-0 focus-visible:underline"
              entry={{ dialog: "invoice", id: invoice.id }}
            >
              <span className="text-muted-foreground tabular-nums md:hidden">
                {numberOf(invoice)} ·{" "}
              </span>
              {forLabel(invoice)}
            </FinanceDialogLink>
            <span className="text-muted-foreground hidden tabular-nums md:block">
              {invoice.status === "draft"
                ? "—"
                : format.date(invoice.issueDate)}
            </span>
            <span
              className={cn(
                "text-muted-foreground hidden tabular-nums md:block",
                invoice.status === "overdue" && "text-destructive font-medium"
              )}
            >
              {dueLabel(invoice)}
            </span>
            <span className="text-right tabular-nums">
              {ledger.money(invoice.amountMinor, invoice.currency)}
            </span>
          </li>
        ))}
        {data.invoices.length > INVOICE_PREVIEW && (
          <li className="flex min-h-10 items-center px-3.5 md:px-5">
            <Button
              size="xs"
              variant="link"
              render={
                <Link
                  search={{ client: data.client.id }}
                  to="/finances/invoices"
                />
              }
              nativeButton={false}
            >
              {t("clients.allInvoicesOf", { name: data.client.name })}
            </Button>
          </li>
        )}
      </ListRows>
    </section>
  );
};

const ArchiveButton = ({ client }: { client: ClientDetailBody["client"] }) => {
  const { t } = useTranslation("finances");
  const confirm = useConfirm();
  const update = useUpdateClient();

  return (
    <Button
      onClick={async () => {
        if (client.archived) {
          update.mutate({
            id: client.id,
            json: { archived: false },
            name: client.name,
          });

          return;
        }

        const ok = await confirm({
          confirmLabel: t("clients.archive"),
          description: t("clients.archiveDescription"),
          title: t("clients.archiveTitle", { name: client.name }),
        });

        if (ok) {
          update.mutate({
            id: client.id,
            json: { archived: true },
            name: client.name,
          });
        }
      }}
      size="compact"
      variant="outline"
    >
      {client.archived ? <ArchiveRestore /> : <Archive />}
      {client.archived ? t("clients.unarchive") : t("clients.archive")}
    </Button>
  );
};

/** Client detail (2.3): header, stats, invoices, earned per month, details aside. */
export const ClientDetail = ({
  clientId,
  year,
}: {
  clientId: string;
  year: number;
}) => {
  const { t } = useTranslation("finances");
  const month = useMonthLabel();
  const detail = useQuery(clientQuery(clientId, year));

  if (detail.isPending) {
    return <LoadingState rows={6} />;
  }

  if (detail.isError) {
    return (
      <ErrorState
        error={detail.error}
        onRetry={() => {
          void detail.refetch();
        }}
      />
    );
  }

  const { client } = detail.data;

  const meta = [
    client.since === null
      ? null
      : t("clients.since", {
          date: month(client.since.slice(0, 7)),
        }),
    client.currency,
    client.kind === "employer"
      ? null
      : t("clients.pays", { days: client.paymentTermsDays }),
  ].filter((part) => part !== null);

  return (
    <div className="flex flex-col gap-5 md:grid md:grid-cols-[minmax(0,1fr)_16rem] md:gap-0">
      <div className="md:border-divider flex min-w-0 flex-col gap-5 md:gap-0 md:border-r">
        <header
          className="flex items-center gap-3 md:px-5 md:py-4"
          data-bleed=""
        >
          <ClientMonogram name={client.name} size="lg" />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight">
              {client.name}
            </h2>
            <p className="text-muted-foreground text-sm tabular-nums">
              {meta.join(" · ")}
            </p>
          </div>
        </header>
        <StatPanel bleed className="md:border-t">
          <Stat
            label={t("clients.earnedIn", { year })}
            value={<AnimatedTotals values={client.earnedThisYear} />}
          />
          <Stat
            label={t("clients.allTime")}
            value={<AnimatedTotals values={client.earnedAllTime} />}
          />
          <Stat
            label={t("invoices.unpaid")}
            value={<AnimatedTotals values={client.unpaid} />}
          />
          <Stat
            label={t("clients.usuallyPays")}
            value={
              client.averageDaysToGetPaid === null
                ? "—"
                : t("clients.days", { count: client.averageDaysToGetPaid })
            }
          />
        </StatPanel>
        <InvoicesList data={detail.data} />
        {client.kind === "client" && <ProjectsSection clientId={client.id} />}
        <div className="md:px-5 md:py-4">
          <EarnedByMonth
            currency={client.currency}
            months={client.earnedByMonth}
          />
        </div>
      </div>
      <aside className="flex flex-col gap-4 md:px-5 md:py-4">
        <h3 className="text-subtle-foreground text-sm font-semibold">
          {t("clients.details")}
        </h3>
        <dl className="bg-card flex flex-col gap-3 rounded-lg border p-4 md:border-0 md:bg-transparent md:p-0">
          <Detail label={t("clients.columns.kind")}>
            {t(`clients.kind.${client.kind}`)}
          </Detail>
          <Detail label={t("clients.currency")}>{client.currency}</Detail>
          <Detail label={t("clients.terms")}>
            {t("clients.termsDays", { count: client.paymentTermsDays })}
          </Detail>
          {client.email !== null && (
            <Detail label={t("clients.email")}>{client.email}</Detail>
          )}
          {client.notes !== null && (
            <Detail label={t("clients.notes")}>{client.notes}</Detail>
          )}
        </dl>
        <div>
          <ArchiveButton client={client} />
        </div>
      </aside>
    </div>
  );
};
