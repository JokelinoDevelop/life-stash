import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CarFront, ListChecks, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { PageHeader } from "@/components/app/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CarCard } from "@/modules/garage/cars/car-card";
import { carsQuery } from "@/modules/garage/cars/cars.queries";
import { UpcomingAcrossCars } from "@/modules/garage/cars/upcoming-across-cars";
import { HouseholdSpendingCard } from "@/modules/garage/spending/household-spending-card";

const GarageHome = () => {
  const { t } = useTranslation("garage");
  const [showArchived, setShowArchived] = useState(false);
  const cars = useQuery(carsQuery(showArchived));

  return (
    <>
      <PageHeader
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/garage/catalog">
                <ListChecks />
                {t("home.catalog")}
              </Link>
            </Button>
            <Button asChild>
              <Link to="/garage/cars/new">
                <Plus />
                {t("cars.add")}
              </Link>
            </Button>
          </>
        }
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
        <div className="flex flex-col gap-8">
          {cars.data.cars.length === 0 ? (
            <EmptyState
              action={
                <Button asChild>
                  <Link to="/garage/cars/new">
                    <Plus />
                    {t("cars.add")}
                  </Link>
                </Button>
              }
              icon={<CarFront className="size-10" />}
              message={t("cars.empty")}
            />
          ) : (
            <>
              <UpcomingAcrossCars cars={cars.data.cars} />
              <HouseholdSpendingCard />
              <section className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold">{t("cars.title")}</h2>
                <div className="grid gap-3 lg:grid-cols-2">
                  {cars.data.cars.map((car) => (
                    <CarCard car={car} key={car.id} />
                  ))}
                </div>
              </section>
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
