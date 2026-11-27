import { reminderHorizon } from "@shared/domain/reminders";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CarFront, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useCommandMenu } from "@/components/app/command-menu-context";
import { HouseholdName } from "@/components/app/household-name";
import { ListSection } from "@/components/app/list-section";
import { LOADING_LAYOUTS } from "@/components/app/loading-layouts";
import { PageHeader, PageStack } from "@/components/app/page-header";
import { BodySkeleton, PageSkeleton } from "@/components/app/page-skeleton";
import { EmptyState, ErrorState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useHotkey } from "@/hooks/use-hotkey";
import { useFormat } from "@/lib/format";
import { ADD_CAR_SHORTCUT } from "@/lib/shortcuts";
import { cached, warm } from "@/lib/warm";
import { CarRow } from "@/modules/garage/cars/car-row";
import type { CarListItem } from "@/modules/garage/cars/car-row";
import { carsQuery } from "@/modules/garage/cars/cars.queries";
import { EntryDialogLink } from "@/modules/garage/entry-dialogs/entry-dialog-link";
import { useEntryDialog } from "@/modules/garage/entry-dialogs/use-entry-dialog";
import { BrowseLinks } from "@/modules/garage/household/browse-links";
import { householdMoney } from "@/modules/garage/household/household-money";
import {
  SpendingByMonth,
  SpentCard,
} from "@/modules/garage/household/household-spending";
import { HouseholdStats } from "@/modules/garage/household/household-stats";
import { householdOverviewQuery } from "@/modules/garage/household/household.queries";
import type { HouseholdOverview } from "@/modules/garage/household/household.queries";
import { DueReminders } from "@/modules/garage/household/reminder-groups";

const useSummary = (cars: CarListItem[] | undefined): string | undefined => {
  const { t } = useTranslation("garage");

  if (cars === undefined || cars.length === 0) {
    return undefined;
  }

  const active = cars.filter((car) => car.archivedAt === null);
  const overdue = active.reduce((sum, car) => sum + car.overdueCount, 0);
  const dueSoon = active.reduce((sum, car) => sum + car.dueSoonCount, 0);

  return overdue + dueSoon === 0
    ? t("home.summaryClear")
    : t("home.summary", { dueSoon, overdue });
};

const HeaderActions = () => {
  const { t } = useTranslation("garage");
  const { t: tc } = useTranslation("command");
  const { open: handleOpenMenu } = useCommandMenu();

  return (
    <>
      <span className="flex md:hidden">
        <Button
          aria-label={tc("search")}
          onClick={handleOpenMenu}
          size="icon-compact"
          variant="ghost"
        >
          <Search />
        </Button>
        <Button
          size="icon-compact"
          variant="ghost"
          render={
            <EntryDialogLink
              aria-label={t("cars.add")}
              entry={{ dialog: "car" }}
            />
          }
          nativeButton={false}
        >
          <Plus />
        </Button>
      </span>
      <span className="hidden md:flex">
        <Button
          size="compact"
          render={<EntryDialogLink entry={{ dialog: "car" }} />}
          nativeButton={false}
        >
          <Plus />
          {t("cars.add")}
          <Kbd>{ADD_CAR_SHORTCUT.toUpperCase()}</Kbd>
        </Button>
      </span>
    </>
  );
};

const GarageContent = ({
  cars,
  overview,
}: {
  cars: CarListItem[];
  overview: HouseholdOverview;
}) => {
  const { t } = useTranslation("garage");
  const format = useFormat();
  const money = householdMoney(overview, format.currency);
  const year = Number(overview.today.slice(0, 4));
  const monthIndex = Number(overview.today.slice(5, 7)) - 1;
  const active = cars.filter((car) => car.archivedAt === null);

  const overdue = overview.reminders.filter(
    (reminder) => reminderHorizon(reminder) === "overdue"
  );

  const next30 = overview.reminders.filter(
    (reminder) => reminderHorizon(reminder) === "next30"
  );

  return (
    <PageStack>
      <div className="md:hidden">
        <SpentCard money={money} monthIndex={monthIndex} year={year} />
      </div>
      <HouseholdStats
        carCount={active.length}
        kmThisYear={overview.kmThisYear}
        money={money}
        next30={next30}
        overdue={overdue}
        year={year}
      />
      <DueReminders cars={cars} reminders={overview.reminders} />
      <ListSection count={cars.length} title={t("cars.title")}>
        {cars.map((car) => {
          const spent = money.carTotals.get(car.id);

          return (
            <CarRow
              car={car}
              key={car.id}
              spent={
                spent === undefined
                  ? undefined
                  : format.money(spent, money.currency)
              }
            />
          );
        })}
      </ListSection>
      <div className="hidden md:block">
        <SpendingByMonth cars={active} money={money} monthIndex={monthIndex} />
      </div>
      <BrowseLinks />
    </PageStack>
  );
};

const GarageHome = () => {
  const { t } = useTranslation("garage");
  const [showArchived, setShowArchived] = useState(false);

  // Keep the current list on screen while the archived toggle refetches.
  const cars = useQuery({
    ...carsQuery(showArchived),
    placeholderData: keepPreviousData,
  });

  const overview = useQuery(householdOverviewQuery);
  const summary = useSummary(cars.data?.cars);
  const entryDialog = useEntryDialog();

  const handleAddCar = () => {
    void entryDialog.open({ dialog: "car" });
  };

  useHotkey(ADD_CAR_SHORTCUT, handleAddCar);

  return (
    <>
      <PageHeader
        actions={<HeaderActions />}
        description={summary}
        account
        mobileTop={<HouseholdName className="-ml-1" />}
        title={t("title")}
      />
      {(cars.isPending || overview.isPending) && (
        <BodySkeleton {...LOADING_LAYOUTS.garage} />
      )}
      {cars.isError && (
        <ErrorState
          error={cars.error}
          onRetry={() => {
            void cars.refetch();
          }}
        />
      )}
      {cars.isSuccess && overview.isSuccess && (
        <div className="flex flex-col gap-6 md:gap-0">
          {cars.data.cars.length === 0 ? (
            <div className="md:p-5">
              <EmptyState
                action={
                  <Button
                    size="compact"
                    render={<EntryDialogLink entry={{ dialog: "car" }} />}
                    nativeButton={false}
                  >
                    <Plus />
                    {t("cars.add")}
                    <Kbd className="hidden md:inline-flex">
                      {ADD_CAR_SHORTCUT.toUpperCase()}
                    </Kbd>
                  </Button>
                }
                icon={<CarFront />}
                message={t("cars.empty")}
              />
            </div>
          ) : (
            <GarageContent cars={cars.data.cars} overview={overview.data} />
          )}
          <div className="flex items-center gap-2 md:px-5 md:py-4">
            <Switch
              checked={showArchived}
              id="show-archived"
              onCheckedChange={setShowArchived}
            />
            <Label htmlFor="show-archived">{t("cars.showArchived")}</Label>
          </div>
        </div>
      )}
    </>
  );
};

export const Route = createFileRoute("/_app/garage/")({
  loader: async ({ context: { queryClient } }) => {
    await warm(
      queryClient.query(cached(carsQuery(false))),
      queryClient.query(cached(householdOverviewQuery))
    );
  },
  pendingComponent: () => <PageSkeleton {...LOADING_LAYOUTS.garage} />,
  component: GarageHome,
});
