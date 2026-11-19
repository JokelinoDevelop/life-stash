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

  useHotkey(FINANCE_SHORTCUTS.newInvoice, newInvoice);

  return (
    <>
      <PageHeader
        actions={
          <>
            <Button
              onClick={() => {
                void dialog.open({ dialog: "client", id: clientId });
              }}
              size="compact"
              variant="ghost"
            >
              <Pencil />
              <span className="hidden md:inline">{t("clients.edit")}</span>
            </Button>
            <Button onClick={newInvoice} size="compact">
              <Plus />
              <span className="hidden md:inline">{t("invoices.new")}</span>
              <Kbd className="hidden md:inline-flex">
                {FINANCE_SHORTCUTS.newInvoice.toUpperCase()}
              </Kbd>
            </Button>
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
  component: ClientPage,
});
