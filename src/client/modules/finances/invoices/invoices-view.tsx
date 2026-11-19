import { useQuery } from "@tanstack/react-query";
import { FileText, SearchX } from "lucide-react";
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { useHotkey } from "@/hooks/use-hotkey";
import { useFormat } from "@/lib/format";
import { FINANCE_SHORTCUTS } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

import { clientsQuery } from "../clients/clients.queries";
import { useFinanceDialog } from "../dialogs/use-finance-dialog";
import { groupInvoices } from "./group-invoices";
import type { InvoiceGroup } from "./group-invoices";
import { INVOICE_GRID, InvoiceRow } from "./invoice-row";
import type { InvoicesSearch, InvoicesSearchPatch } from "./invoices-search";
import { InvoicesStats } from "./invoices-stats";
import { InvoicesToolbar } from "./invoices-toolbar";
import { invoicesQuery } from "./invoices.queries";
import type { InvoiceListItem } from "./invoices.queries";

/** Paid invoices pile up; show this many before "Show N more". */
const PAID_PREVIEW = 8;

const ColumnHeader = () => {
  const { t } = useTranslation("finances");

  return (
    <div
      className={cn(
        "border-divider text-muted-foreground hidden h-7 items-center px-5 text-xs font-medium md:grid",
        INVOICE_GRID
      )}
    >
      <span />
      <span>{t("invoices.columns.number")}</span>
      <span>{t("invoices.columns.client")}</span>
      <span>{t("invoices.columns.for")}</span>
      <span>{t("invoices.columns.issued")}</span>
      <span>{t("invoices.columns.duePaid")}</span>
      <span className="text-right">{t("invoices.columns.amount")}</span>
      <span />
    </div>
  );
};

const Group = ({
  group,
  onFocus,
  year,
}: {
  group: InvoiceGroup<InvoiceListItem>;
  onFocus: (invoiceId: string) => void;
  year: number;
}) => {
  const { t } = useTranslation("finances");
  const format = useFormat();
  const [expanded, setExpanded] = useState(false);

  const capped =
    group.key === "paid" && !expanded && group.rows.length > PAID_PREVIEW;

  const rows = capped ? group.rows.slice(0, PAID_PREVIEW) : group.rows;

  const title =
    group.key === "paid"
      ? t("invoices.groups.paidIn", { year })
      : t(`invoices.groups.${group.key}`);

  return (
    <section className="flex flex-col gap-2 md:gap-0" data-bleed="">
      <div className="md:bg-background md:border-divider flex items-baseline gap-2 px-0.5 text-sm md:h-8 md:items-center md:border-b md:px-5 md:text-xs">
        <h2 className="text-subtle-foreground font-semibold md:font-medium">
          {title}
        </h2>
        <span className="text-muted-foreground tabular-nums">
          {group.rows.length}
        </span>
        <span className="text-muted-foreground ml-auto hidden tabular-nums md:inline">
          {format.totals(group.total)}
        </span>
      </div>
      <ul className="bg-card divide-divider md:border-divider divide-y overflow-hidden rounded-lg border md:rounded-none md:border-0 md:border-b">
        {rows.map((invoice) => (
          <InvoiceRow invoice={invoice} key={invoice.id} onFocus={onFocus} />
        ))}
        {capped && (
          <li className="flex min-h-11 items-center px-3.5 md:min-h-10 md:pl-33">
            <Button
              onClick={() => {
                setExpanded(true);
              }}
              size="xs"
              variant="link"
            >
              {t("invoices.showMore", {
                count: group.rows.length - PAID_PREVIEW,
              })}
            </Button>
          </li>
        )}
      </ul>
    </section>
  );
};

const Empty = ({
  onShowAll,
  search,
  year,
}: {
  onShowAll: () => void;
  search: InvoicesSearch;
  year: number;
}) => {
  const { t } = useTranslation("finances");
  const dialog = useFinanceDialog();

  if (search.status !== undefined || search.client !== undefined) {
    const unpaid = search.status === "unpaid";

    return (
      <EmptyState
        action={
          <Button onClick={onShowAll} size="compact" variant="ghost">
            {t("invoices.empty.showAll")}
          </Button>
        }
        icon={<SearchX />}
        message={
          unpaid
            ? t("invoices.empty.unpaidMessage")
            : t("invoices.empty.paidMessage", { year })
        }
        title={
          unpaid
            ? t("invoices.empty.unpaidTitle")
            : t("invoices.empty.paidTitle", { year })
        }
      />
    );
  }

  return (
    <EmptyState
      action={
        <Button
          onClick={() => {
            void dialog.open({ dialog: "invoice" });
          }}
          size="compact"
        >
          {t("invoices.new")}
        </Button>
      }
      icon={<FileText />}
      message={t("invoices.empty.message")}
      title={t("invoices.empty.title")}
    />
  );
};

/** Invoices page (2.1, 5.3): stats, filters, status groups; `P` marks the focused row paid. */
export const InvoicesView = ({
  currentYear,
  onSearchChange,
  search,
}: {
  currentYear: number;
  onSearchChange: (patch: InvoicesSearchPatch) => void;
  search: InvoicesSearch;
}) => {
  const year = search.year ?? currentYear;
  const dialog = useFinanceDialog();
  const focused = useRef<string | null>(null);
  const clients = useQuery(clientsQuery(year));

  const list = useQuery(
    invoicesQuery({
      clientId: search.client,
      status: search.status ?? "all",
      year,
    })
  );

  const rows = list.data?.invoices ?? [];

  useHotkey(FINANCE_SHORTCUTS.markPaid, () => {
    const target = rows.find((row) => row.id === focused.current);

    if (
      target !== undefined &&
      (target.status === "sent" || target.status === "overdue")
    ) {
      void dialog.open({ dialog: "mark-paid", id: target.id });
    }
  });

  let content: ReactNode;

  if (list.isPending) {
    content = <LoadingState rows={5} sections={2} />;
  } else if (list.isError) {
    content = (
      <ErrorState
        error={list.error}
        onRetry={() => {
          void list.refetch();
        }}
      />
    );
  } else if (rows.length === 0) {
    content = (
      <Empty
        onShowAll={() => {
          onSearchChange({ client: null, status: null });
        }}
        search={search}
        year={year}
      />
    );
  } else {
    content = (
      <>
        <ColumnHeader />
        {groupInvoices(rows).map((group) => (
          <Group
            group={group}
            key={group.key}
            onFocus={(invoiceId) => {
              focused.current = invoiceId;
            }}
            year={year}
          />
        ))}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-0">
      {list.data !== undefined && (
        <div className="hidden md:block">
          <InvoicesStats list={list.data} />
        </div>
      )}
      <InvoicesToolbar
        clients={clients.data?.clients ?? []}
        currentYear={currentYear}
        onChange={onSearchChange}
        search={search}
      />
      <div className="flex flex-col gap-5 md:gap-0">{content}</div>
    </div>
  );
};
