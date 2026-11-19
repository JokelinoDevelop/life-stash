import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BackLink } from "@/components/app/back-link";
import { PageHeader, PageStack } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { todayIso } from "@/lib/partial-date";
import { ClientsView } from "@/modules/finances/clients/clients-view";
import { useFinanceDialog } from "@/modules/finances/dialogs/use-finance-dialog";

const ClientsPage = () => {
  const { t } = useTranslation("finances");
  const dialog = useFinanceDialog();
  const year = Number(todayIso().slice(0, 4));

  const newClient = () => {
    void dialog.open({ dialog: "client" });
  };

  return (
    <>
      <PageHeader
        actions={
          <>
            <Button
              aria-label={t("clients.new")}
              className="md:hidden"
              onClick={newClient}
              size="icon-compact"
              variant="ghost"
            >
              <Plus />
            </Button>
            <Button
              className="hidden md:inline-flex"
              onClick={newClient}
              size="compact"
            >
              <Plus />
              {t("clients.new")}
            </Button>
          </>
        }
        back={<BackLink label={t("title")} to="/finances" />}
        title={t("clients.title")}
      />
      <PageStack>
        <ClientsView year={year} />
      </PageStack>
    </>
  );
};

export const Route = createFileRoute("/_app/finances/clients/")({
  component: ClientsPage,
});
