import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { BackLink } from "@/components/app/back-link";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useHotkey } from "@/hooks/use-hotkey";
import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";
import { FINANCE_SHORTCUTS } from "@/lib/shortcuts";
import { cached, warm } from "@/lib/warm";
import { clientsQuery } from "@/modules/finances/clients/clients.queries";
import { useFinanceDialog } from "@/modules/finances/dialogs/use-finance-dialog";
import {
  applyInvoicesPatch,
  invoicesSearchSchema,
} from "@/modules/finances/invoices/invoices-search";
import type { InvoicesSearchPatch } from "@/modules/finances/invoices/invoices-search";
import { InvoicesView } from "@/modules/finances/invoices/invoices-view";
import { invoicesQuery } from "@/modules/finances/invoices/invoices.queries";

const InvoicesPage = () => {
  const { t } = useTranslation("finances");
  const format = useFormat();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const dialog = useFinanceDialog();
  const currentYear = Number(todayIso().slice(0, 4));
  const year = search.year ?? currentYear;

  const list = useQuery(
    invoicesQuery({
      clientId: search.client,
      status: search.status ?? "all",
      year,
    })
  );

  const newInvoice = () => {
    void dialog.open({ dialog: "invoice" });
  };

  useHotkey(FINANCE_SHORTCUTS.newInvoice, newInvoice);

  const onSearchChange = useCallback(
    (patch: InvoicesSearchPatch) => {
      void navigate({
        replace: true,
        search: (prev) => applyInvoicesPatch(prev, patch),
      });
    },
    [navigate]
  );

  return (
    <>
      <PageHeader
        actions={
          <>
            <Button
              aria-label={t("invoices.new")}
              className="md:hidden"
              onClick={newInvoice}
              size="icon-compact"
              variant="ghost"
            >
              <Plus />
            </Button>
            <Button
              className="hidden md:inline-flex"
              onClick={newInvoice}
              size="compact"
            >
              <Plus />
              {t("invoices.new")}
              <Kbd>{FINANCE_SHORTCUTS.newInvoice.toUpperCase()}</Kbd>
            </Button>
          </>
        }
        back={<BackLink label={t("title")} to="/finances" />}
        description={
          list.data === undefined
            ? undefined
            : t("invoices.subtitle", {
                invoiced: format.totals(list.data.stats.invoiced),
                unpaid: format.totals(list.data.stats.unpaid),
                year,
              })
        }
        title={t("invoices.title")}
      />
      <InvoicesView
        currentYear={currentYear}
        onSearchChange={onSearchChange}
        search={search}
      />
    </>
  );
};

export const Route = createFileRoute("/_app/finances/invoices")({
  validateSearch: invoicesSearchSchema,
  loaderDeps: ({ search }) => ({
    client: search.client,
    status: search.status,
    year: search.year,
  }),
  loader: async ({ context: { queryClient }, deps }) => {
    const year = deps.year ?? Number(todayIso().slice(0, 4));

    await warm(
      queryClient.query(cached(clientsQuery(year))),
      queryClient.query(
        cached(
          invoicesQuery({
            clientId: deps.client,
            status: deps.status ?? "all",
            year,
          })
        )
      )
    );
  },
  component: InvoicesPage,
});
