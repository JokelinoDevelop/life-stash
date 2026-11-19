import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { BackLink } from "@/components/app/back-link";
import { PageHeader, PageStack } from "@/components/app/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CarActions } from "@/modules/garage/cars/car-actions";
import { CarHeading } from "@/modules/garage/cars/car-heading";
import { CAR_TABS } from "@/modules/garage/cars/car-tabs";
import type { CarTab } from "@/modules/garage/cars/car-tabs";
import { carQuery } from "@/modules/garage/cars/cars.queries";
import { DetailsTab } from "@/modules/garage/cars/details-tab";
import { OverviewTab } from "@/modules/garage/cars/overview-tab";
import { useCarShortcuts } from "@/modules/garage/cars/use-car-shortcuts";
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
  const tabStrip = useRef<HTMLDivElement>(null);
  useCarShortcuts(carId, !readOnly);

  useEffect(() => {
    const strip = tabStrip.current;

    const reveal = () => {
      strip
        ?.querySelector(`[id$="-trigger-${tab}"]`)
        ?.scrollIntoView({ block: "nearest", inline: "nearest" });
    };

    // Runs once the strip has a real size (after Suspense reveals it and
    // fonts load), then again whenever the tab changes.
    const observer = new ResizeObserver(reveal);

    if (strip !== null) {
      observer.observe(strip);
    }

    return () => {
      observer.disconnect();
    };
  }, [tab]);

  return (
    <>
      <PageHeader
        actions={<CarActions car={car} />}
        back={<BackLink label={t("title")} to="/garage" />}
        hideMobileTitle
        title={car.name}
      />
      <CarHeading car={car} />
      {readOnly && (
        <Alert className="mt-4 md:mx-7 md:w-auto">
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
        <div
          className="-mx-4 mt-4 mb-4 scroll-px-4 scrollbar-none overflow-x-auto px-4 md:mx-0 md:mb-0 md:px-6"
          ref={tabStrip}
        >
          <TabsList variant="pill">
            {CAR_TABS.map((value) => (
              <TabsTrigger key={value} value={value}>
                {t(`car.tabs.${value}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="overview">
          <OverviewTab car={car} carId={carId} readOnly={readOnly} />
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
          <PageStack>
            <DetailsTab car={car} />
          </PageStack>
        </TabsContent>
      </Tabs>
    </>
  );
};

export const Route = createFileRoute("/_app/garage/cars/$carId/")({
  validateSearch: z.object({
    log: z.boolean().optional(),
    /** Page of the tab's long list (history, mileage, expenses); 1 when absent. */
    page: z.number().int().min(2).optional().catch(undefined),
    tab: z.enum(CAR_TABS).catch("overview").default("overview"),
  }),
  loader: async ({ context, params }) => {
    await context.queryClient.query(carQuery(params.carId));
  },
  component: CarPage,
});
