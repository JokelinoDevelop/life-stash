import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { HouseholdMenu } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useHotkey } from "@/hooks/use-hotkey";
import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";
import { FINANCE_SHORTCUTS } from "@/lib/shortcuts";
import { useFinanceDialog } from "@/modules/finances/dialogs/use-finance-dialog";
import { OverviewView } from "@/modules/finances/overview/overview-view";
import { overviewQuery } from "@/modules/finances/overview/overview.queries";

const searchSchema = z.object({
  year: z.coerce.number().int().min(1990).max(2200).optional().catch(undefined),
});

const FinancesPage = () => {
  const { t } = useTranslation("finances");
  const format = useFormat();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const dialog = useFinanceDialog();
  const currentYear = Number(todayIso().slice(0, 4));
  const year = search.year ?? currentYear;
  const overview = useQuery(overviewQuery(year));
  const receivables = overview.data?.receivables;

  const logTransaction = () => {
    void dialog.open({ dialog: "transaction" });
  };

  const newInvoice = () => {
    void dialog.open({ dialog: "invoice" });
  };

  useHotkey(FINANCE_SHORTCUTS.logTransaction, logTransaction);
  useHotkey(FINANCE_SHORTCUTS.newInvoice, newInvoice);

  let status: string | undefined;

  if (receivables !== undefined) {
    if (receivables.unpaidCount === 0) {
      status = t("overview.statusClear");
    } else if (receivables.overdueCount > 0) {
      status = t("overview.status", {
        amount: format.totals(receivables.unpaid),
        count: receivables.overdueCount,
      });
    } else {
      status = t("overview.statusNoOverdue", {
        amount: format.totals(receivables.unpaid),
      });
    }
  }

  return (
    <>
      <PageHeader
        actions={
          <>
            <ToggleGroup
              aria-label={t("overview.year")}
              className="hidden md:flex"
              onValueChange={(value) => {
                const picked = Number(value);

                if (picked > 0) {
                  void navigate({
                    replace: true,
                    search: {
                      year: picked === currentYear ? undefined : picked,
                    },
                  });
                }
              }}
              size="segmented"
              spacing={0.5}
              type="single"
              value={String(year)}
              variant="segmented"
            >
              <ToggleGroupItem value={String(currentYear - 1)}>
                {currentYear - 1}
              </ToggleGroupItem>
              <ToggleGroupItem value={String(currentYear)}>
                {currentYear}
              </ToggleGroupItem>
            </ToggleGroup>
            <Button
              className="hidden md:inline-flex"
              onClick={newInvoice}
              size="compact"
              variant="outline"
            >
              {t("overview.newInvoice")}
              <Kbd>{FINANCE_SHORTCUTS.newInvoice.toUpperCase()}</Kbd>
            </Button>
            <Button
              className="hidden md:inline-flex"
              onClick={logTransaction}
              size="compact"
            >
              <Plus />
              {t("transactions.log")}
              <Kbd>{FINANCE_SHORTCUTS.logTransaction.toUpperCase()}</Kbd>
            </Button>
            <Button
              aria-label={t("transactions.log")}
              className="md:hidden"
              onClick={logTransaction}
              size="icon-compact"
              variant="ghost"
            >
              <Plus />
            </Button>
          </>
        }
        description={status}
        desktopTitle={t("overview.title")}
        mobileTop={<HouseholdMenu />}
        title={t("title")}
      />
      <OverviewView year={year} />
    </>
  );
};

export const Route = createFileRoute("/_app/finances/")({
  component: FinancesPage,
  validateSearch: searchSchema,
});
