import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";

import { SectionHeading } from "@/components/app/list-section";
import { PageStack } from "@/components/app/page-header";
import { LoadingState } from "@/components/app/states";
import { todayIso } from "@/lib/partial-date";

import { CategoryStrip } from "../expenses/category-strip";
import { expensesQuery } from "../expenses/expenses.queries";
import { totalsByCategory } from "../expenses/group-expenses";
import { MileageStats } from "../mileage/mileage-stats";
import { mileageQuery } from "../mileage/mileage.queries";
import { SpendingSection } from "../spending/spending-section";
import { ItemHistoryCard } from "../visits/item-history-card";
import { DetailsTab } from "./details-tab";

const MileageCharts = lazy(async () => {
  const module = await import("../mileage/mileage-charts");

  return { default: module.MileageCharts };
});

const Mileage = ({ carId }: { carId: string }) => {
  const { t } = useTranslation("garage");
  const mileage = useQuery(mileageQuery(carId));
  const today = todayIso();

  if (!mileage.isSuccess || mileage.data.points.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <SectionHeading title={t("detailsTab.mileage")} />
      <MileageStats points={mileage.data.points} today={today} />
      <Suspense fallback={<LoadingState variant="block" />}>
        <MileageCharts points={mileage.data.points} today={today} />
      </Suspense>
    </section>
  );
};

const Costs = ({ carId }: { carId: string }) => {
  const { t } = useTranslation("garage");
  const expenses = useQuery(expensesQuery(carId));
  const year = Number(todayIso().slice(0, 4));

  return (
    <section className="flex flex-col gap-3">
      <SectionHeading title={t("detailsTab.costs")} />
      {expenses.isSuccess && (
        <CategoryStrip
          categories={totalsByCategory(expenses.data.expenses, year)}
        />
      )}
      <SpendingSection carId={carId} />
    </section>
  );
};

/** The car's facts and its numbers: details, mileage, costs, and when each item was last done. */
export const DetailsStatsTab = ({
  car,
  carId,
}: {
  car: ComponentProps<typeof DetailsTab>["car"];
  carId: string;
}) => {
  const { t } = useTranslation("garage");

  return (
    <PageStack>
      <section className="flex flex-col gap-3">
        <SectionHeading title={t("detailsTab.car")} />
        <DetailsTab car={car} />
      </section>
      <Mileage carId={carId} />
      <Costs carId={carId} />
      <ItemHistoryCard carId={carId} />
    </PageStack>
  );
};
