import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";

import { PageStack } from "@/components/app/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { useFormat } from "@/lib/format";

import { mainCurrency } from "./main-currency";
import { SpendingTable } from "./spending-table";
import { carSpendingQuery } from "./spending.queries";

const SpendingChart = lazy(async () => {
  const module = await import("./spending-chart");

  return { default: module.SpendingChart };
});

export const SpendingTab = ({
  carId,
}: {
  carId: string;
  readOnly: boolean;
}) => {
  const { t } = useTranslation("garageSpending");
  const format = useFormat();
  const spending = useQuery(carSpendingQuery(carId));

  if (spending.isPending) {
    return <LoadingState rows={2} />;
  }

  if (spending.isError) {
    return (
      <ErrorState
        error={spending.error}
        onRetry={() => {
          void spending.refetch();
        }}
      />
    );
  }

  const { years } = spending.data;

  if (years.length === 0) {
    return (
      <PageStack>
        <EmptyState icon={<Wallet />} message={t("empty")} />
      </PageStack>
    );
  }

  const currency = mainCurrency(years, format.currency);

  const others = [...new Set(years.map((year) => year.currency))].filter(
    (code) => code !== currency
  );

  return (
    <PageStack>
      <Suspense fallback={<LoadingState variant="block" />}>
        <SpendingChart currency={currency} years={years} />
      </Suspense>
      {others.length > 0 && (
        <p className="text-muted-foreground text-sm">
          {t("otherCurrencies", { currencies: others.join(", ") })}
        </p>
      )}
      <SpendingTable years={years} />
      <p className="text-muted-foreground text-xs">{t("previousOwnerNote")}</p>
    </PageStack>
  );
};
