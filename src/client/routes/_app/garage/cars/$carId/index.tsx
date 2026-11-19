import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { BackLink } from "@/components/app/back-link";
import { PageHeader } from "@/components/app/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CarActions } from "@/modules/garage/cars/car-actions";
import { CarMonogram } from "@/modules/garage/cars/car-monogram";
import { CAR_TABS } from "@/modules/garage/cars/car-tabs";
import type { CarTab } from "@/modules/garage/cars/car-tabs";
import { carQuery } from "@/modules/garage/cars/cars.queries";
import { DetailsTab } from "@/modules/garage/cars/details-tab";
import { OverviewTab } from "@/modules/garage/cars/overview-tab";
import { ExpensesTab } from "@/modules/garage/expenses/expenses-tab";
import { MileageTab } from "@/modules/garage/mileage/mileage-tab";
import { RemindersTab } from "@/modules/garage/reminders/reminders-tab";
import { SpendingTab } from "@/modules/garage/spending/spending-tab";
import { HistoryTab } from "@/modules/garage/visits/history-tab";

const isCarTab = (value: string): value is CarTab =>
  CAR_TABS.some((tab) => tab === value);

const CarPage = () => {
  const { carId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { t } = useTranslation("garage");
  const { data } = useSuspenseQuery(carQuery(carId));
  const { car } = data;
  const readOnly = car.archivedAt !== null;

  const subtitle = [
    [car.year, car.make, car.model].filter((part) => part !== null).join(" "),
    car.plate,
  ]
    .filter((part) => part !== null && part !== "")
    .join(" · ");

  return (
    <>
      <PageHeader
        actions={<CarActions car={car} />}
        back={<BackLink to="/garage" />}
        description={subtitle === "" ? undefined : subtitle}
        title={
          <span className="flex items-center gap-3">
            <CarMonogram className="size-10 text-sm" name={car.name} />
            {car.name}
          </span>
        }
      />
      {readOnly && (
        <Alert className="mb-4">
          <AlertDescription>{t("car.readOnly")}</AlertDescription>
        </Alert>
      )}
      <Tabs
        onValueChange={(value) => {
          if (isCarTab(value)) {
            void navigate({ replace: true, search: { tab: value } });
          }
        }}
        value={tab}
      >
        <div className="-mx-4 mb-4 scrollbar-none overflow-x-auto px-4 md:mx-0 md:px-0">
          <TabsList variant="pill">
            {CAR_TABS.map((value) => (
              <TabsTrigger key={value} value={value}>
                {t(`car.tabs.${value}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="overview">
          <OverviewTab carId={carId} readOnly={readOnly} />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab carId={carId} readOnly={readOnly} />
        </TabsContent>
        <TabsContent value="reminders">
          <RemindersTab carId={carId} readOnly={readOnly} />
        </TabsContent>
        <TabsContent value="mileage">
          <MileageTab carId={carId} readOnly={readOnly} />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensesTab carId={carId} readOnly={readOnly} />
        </TabsContent>
        <TabsContent value="spending">
          <SpendingTab carId={carId} readOnly={readOnly} />
        </TabsContent>
        <TabsContent value="details">
          <DetailsTab car={car} />
        </TabsContent>
      </Tabs>
    </>
  );
};

export const Route = createFileRoute("/_app/garage/cars/$carId/")({
  validateSearch: z.object({
    log: z.boolean().optional(),
    tab: z.enum(CAR_TABS).catch("overview").default("overview"),
  }),
  loader: async ({ context, params }) => {
    await context.queryClient.query(carQuery(params.carId));
  },
  component: CarPage,
});
