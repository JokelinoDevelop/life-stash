import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import { HouseholdName } from "@/components/app/app-shell";
import { useCommandMenu } from "@/components/app/command-menu-context";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { todayIso } from "@/lib/partial-date";
import { cached, warm } from "@/lib/warm";
import { overviewQuery } from "@/modules/finances/overview/overview.queries";
import { carsQuery } from "@/modules/garage/cars/cars.queries";
import { householdOverviewQuery } from "@/modules/garage/household/household.queries";
import { TodayView, useTodayCount } from "@/modules/today/today-view";

const TodayPage = () => {
  const { t } = useTranslation("today");
  const { t: tc } = useTranslation("command");
  const { open: handleOpenMenu } = useCommandMenu();
  const { count } = useTodayCount();

  return (
    <>
      <PageHeader
        actions={
          <Button
            aria-label={tc("search")}
            className="md:hidden"
            onClick={handleOpenMenu}
            size="icon-compact"
            variant="ghost"
          >
            <Search />
          </Button>
        }
        description={count === 0 ? t("summaryClear") : t("summary", { count })}
        mobileTop={<HouseholdName className="-ml-1" />}
        title={t("title")}
      />
      <TodayView />
    </>
  );
};

export const Route = createFileRoute("/_app/")({
  loader: async ({ context: { queryClient } }) => {
    const year = Number(todayIso().slice(0, 4));

    await warm(
      queryClient.query(cached(householdOverviewQuery)),
      queryClient.query(cached(carsQuery(false))),
      queryClient.query(cached(overviewQuery(year)))
    );
  },
  component: TodayPage,
});
