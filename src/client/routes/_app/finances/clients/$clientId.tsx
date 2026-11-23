import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BackLink } from "@/components/app/back-link";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useHotkey } from "@/hooks/use-hotkey";
import { todayIso } from "@/lib/partial-date";
import { FINANCE_SHORTCUTS } from "@/lib/shortcuts";
import { cached, warm } from "@/lib/warm";
import { ClientDetail } from "@/modules/finances/clients/client-detail";
import { clientQuery } from "@/modules/finances/clients/clients.queries";
import { useFinanceDialog } from "@/modules/finances/dialogs/use-finance-dialog";

const ClientPage = () => {
  const { t } = useTranslation("finances");
  const { clientId } = Route.useParams();
  const dialog = useFinanceDialog();
  const year = Number(todayIso().slice(0, 4));
  const detail = useQuery(clientQuery(clientId, year));

  const newInvoice = () => {
    void dialog.open({ dialog: "invoice", forClient: clientId });
  };

  const editClient = () => {
    void dialog.open({ dialog: "client", id: clientId });
  };

  useHotkey(FINANCE_SHORTCUTS.newInvoice, newInvoice);

  return (
    <>
      <PageHeader
        actions={
          <>
            {/* Phones: bare icon buttons, like every phone top row. */}
            <span className="flex md:hidden">
              <Button
                aria-label={t("clients.edit")}
                onClick={editClient}
                size="icon-compact"
                variant="ghost"
              >
                <Pencil />
              </Button>
              <Button
                aria-label={t("invoices.new")}
                onClick={newInvoice}
                size="icon-compact"
                variant="ghost"
              >
                <Plus />
              </Button>
            </span>
            <span className="hidden items-center gap-1.5 md:flex">
              <Button onClick={editClient} size="compact" variant="ghost">
                <Pencil />
                {t("clients.edit")}
              </Button>
              <Button onClick={newInvoice} size="compact">
                <Plus />
                {t("invoices.new")}
                <Kbd>{FINANCE_SHORTCUTS.newInvoice.toUpperCase()}</Kbd>
              </Button>
            </span>
          </>
        }
        back={<BackLink label={t("clients.title")} to="/finances/clients" />}
        hideMobileTitle
        title={detail.data?.client.name ?? t("clients.title")}
      />
      <ClientDetail clientId={clientId} year={year} />
    </>
  );
};

export const Route = createFileRoute("/_app/finances/clients/$clientId")({
  loader: async ({ context: { queryClient }, params }) => {
    await warm(
      queryClient.query(
        cached(clientQuery(params.clientId, Number(todayIso().slice(0, 4))))
      )
    );
  },
  component: ClientPage,
});
