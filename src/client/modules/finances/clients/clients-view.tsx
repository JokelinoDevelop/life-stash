import { formatShortDate } from "@shared/domain/dates";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { useFormat } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useFinanceDialog } from "../dialogs/use-finance-dialog";
import { ClientMonogram } from "./client-monogram";
import { clientsQuery } from "./clients.queries";
import type { ClientListItem } from "./clients.queries";
import { IncomeShare } from "./income-share";

const GRID =
  "md:grid md:grid-cols-[minmax(160px,1fr)_84px_72px_110px_110px_150px] md:gap-3";

const Row = ({ client }: { client: ClientListItem }) => {
  const { t } = useTranslation("finances");
  const format = useFormat();
  const late = client.late.length > 0;
  const last = client.lastInvoice;
  let unpaidLabel = "—";

  if (late) {
    unpaidLabel = t("clients.late", { amount: format.totals(client.late) });
  } else if (client.unpaid.length > 0) {
    unpaidLabel = format.totals(client.unpaid);
  }

  let lastLabel = t("clients.noInvoices");

  if (last !== null) {
    const when =
      last.status === "draft"
        ? t("invoices.status.draft").toLocaleLowerCase()
        : formatShortDate(last.issueDate);

    lastLabel = `${last.number} · ${when}`;
  }

  return (
    <li
      className={cn(
        "group/row bg-card hover:bg-background relative flex min-h-14 items-center gap-3 px-3.5 transition-colors md:min-h-11 md:px-5",
        GRID
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <ClientMonogram name={client.name} />
        <div className="flex min-w-0 flex-col">
          <Link
            className="truncate font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
            params={{ clientId: client.id }}
            to="/finances/clients/$clientId"
          >
            {client.name}
          </Link>
          <span className="text-muted-foreground truncate text-xs">
            <span className="md:hidden">
              {t(`clients.kind.${client.kind}`)} ·{" "}
            </span>
            {client.notes ?? "—"}
          </span>
        </div>
      </div>
      <span className="hidden md:block">
        <span className="bg-muted text-subtle-foreground rounded-sm border px-1.5 py-0.5 text-xs font-medium">
          {t(`clients.kind.${client.kind}`)}
        </span>
      </span>
      <span className="text-muted-foreground hidden tabular-nums md:block">
        {client.kind === "employer"
          ? "—"
          : t("clients.termsDays", { count: client.paymentTermsDays })}
      </span>
      <span className="text-right tabular-nums">
        {format.totals(client.earnedThisYear)}
      </span>
      <span
        className={cn(
          "hidden text-right tabular-nums md:block",
          late && "text-destructive font-medium"
        )}
      >
        {unpaidLabel}
      </span>
      <span className="text-muted-foreground hidden truncate text-right tabular-nums md:block">
        {lastLabel}
      </span>
    </li>
  );
};

const Section = ({
  clients,
  title,
}: {
  clients: ClientListItem[];
  title: string;
}) => (
  <section className="flex flex-col gap-2 md:gap-0" data-bleed="">
    <div className="md:bg-background md:border-divider flex items-baseline gap-2 px-0.5 text-sm md:h-8 md:items-center md:border-b md:px-5 md:text-xs">
      <h2 className="text-subtle-foreground font-semibold md:font-medium">
        {title}
      </h2>
      <span className="text-muted-foreground tabular-nums">
        {clients.length}
      </span>
    </div>
    <ul className="bg-card divide-divider md:border-divider divide-y overflow-hidden rounded-lg border md:rounded-none md:border-0 md:border-b">
      {clients.map((client) => (
        <Row client={client} key={client.id} />
      ))}
    </ul>
  </section>
);

/** Clients (2.2): columns, Active / Archived, share of income. */
export const ClientsView = ({ year }: { year: number }) => {
  const { t } = useTranslation("finances");
  const format = useFormat();
  const dialog = useFinanceDialog();
  const clients = useQuery(clientsQuery(year));

  if (clients.isPending) {
    return <LoadingState rows={4} />;
  }

  if (clients.isError) {
    return (
      <ErrorState
        error={clients.error}
        onRetry={() => {
          void clients.refetch();
        }}
      />
    );
  }

  const all = clients.data.clients;

  if (all.length === 0) {
    return (
      <EmptyState
        action={
          <Button
            onClick={() => {
              void dialog.open({ dialog: "client" });
            }}
            size="compact"
          >
            {t("clients.new")}
          </Button>
        }
        icon={<Users />}
        message={t("clients.empty.message")}
        title={t("clients.empty.title")}
      />
    );
  }

  const active = all.filter((client) => !client.archived);
  const archived = all.filter((client) => client.archived);

  return (
    <>
      <div
        data-bleed=""
        className={cn(
          "border-divider text-muted-foreground hidden h-7 items-center border-b px-5 text-xs font-medium md:grid",
          GRID
        )}
      >
        <span>{t("clients.columns.name")}</span>
        <span>{t("clients.columns.kind")}</span>
        <span>{t("clients.columns.terms")}</span>
        <span className="text-right">
          {t("clients.columns.earned", { year })}
        </span>
        <span className="text-right">{t("clients.columns.unpaid")}</span>
        <span className="text-right">{t("clients.columns.lastInvoice")}</span>
      </div>
      {active.length > 0 && (
        <Section clients={active} title={t("clients.active")} />
      )}
      {archived.length > 0 && (
        <Section clients={archived} title={t("clients.archived")} />
      )}
      <IncomeShare clients={active} preferred={format.currency} year={year} />
    </>
  );
};
