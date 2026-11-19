import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CarFront, ListChecks, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ListSection } from "@/components/app/list-section";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CarRow } from "@/modules/garage/cars/car-row";
import type { CarListItem } from "@/modules/garage/cars/car-row";
import { carsQuery } from "@/modules/garage/cars/cars.queries";
import { UpcomingAcrossCars } from "@/modules/garage/cars/upcoming-across-cars";
import { HouseholdSpendingCard } from "@/modules/garage/spending/household-spending-card";

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

const GarageHome = () => {
  const { t } = useTranslation("garage");
  const [showArchived, setShowArchived] = useState(false);
  const cars = useQuery(carsQuery(showArchived));
  const summary = useSummary(cars.data?.cars);

  return (
    <>
      <PageHeader
        actions={
          <>
            <Button asChild size="compact" variant="ghost">
              <Link to="/garage/catalog">
                <ListChecks />
                {t("home.catalog")}
              </Link>
            </Button>
            <Button asChild size="compact">
              <Link to="/garage/cars/new">
                <Plus />
                {t("cars.add")}
              </Link>
            </Button>
          </>
        }
        description={summary}
        title={t("title")}
      />
      {cars.isPending && <LoadingState />}
      {cars.isError && (
        <ErrorState
          error={cars.error}
          onRetry={() => {
            void cars.refetch();
          }}
        />
      )}
      {cars.isSuccess && (
        <div className="flex flex-col gap-6">
          {cars.data.cars.length === 0 ? (
            <EmptyState
              action={
                <Button asChild size="compact">
                  <Link to="/garage/cars/new">
                    <Plus />
                    {t("cars.add")}
                  </Link>
                </Button>
              }
              icon={<CarFront className="size-8" />}
              message={t("cars.empty")}
            />
          ) : (
            <>
              <UpcomingAcrossCars cars={cars.data.cars} />
              <ListSection
                count={cars.data.cars.length}
                title={t("cars.title")}
              >
                {cars.data.cars.map((car) => (
                  <CarRow car={car} key={car.id} />
                ))}
              </ListSection>
              <HouseholdSpendingCard />
            </>
          )}
          <div className="flex items-center gap-2">
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
  component: GarageHome,
});
