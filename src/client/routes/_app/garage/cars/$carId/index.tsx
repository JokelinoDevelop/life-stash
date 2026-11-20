import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { BackLink } from "@/components/app/back-link";
import { PageHeader } from "@/components/app/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CarActions } from "@/modules/garage/cars/car-actions";
import { CarHeading } from "@/modules/garage/cars/car-heading";
import {
  CAR_TABS,
  legacyCarTab,
  LEGACY_TAB_NAMES,
} from "@/modules/garage/cars/car-tabs";
import type { CarTab } from "@/modules/garage/cars/car-tabs";
import { carQuery } from "@/modules/garage/cars/cars.queries";
import { DetailsStatsTab } from "@/modules/garage/cars/details-stats-tab";
import { OverviewTab } from "@/modules/garage/cars/overview-tab";
import { useCarShortcuts } from "@/modules/garage/cars/use-car-shortcuts";
import { RemindersTab } from "@/modules/garage/reminders/reminders-tab";
import { TIMELINE_FILTERS } from "@/modules/garage/timeline/build-timeline";
import { TimelineTab } from "@/modules/garage/timeline/timeline-tab";

const searchSchema = z.object({
  /** Opens the odometer dialog; push notifications send `log=1`. */
  log: z
    .union([z.boolean(), z.literal(1), z.enum(["1", "true"])])
    .transform((value) => value !== false)
    .optional()
    .catch(undefined),
  /** Page of the tab's long list (timeline); 1 when absent. */
  page: z.number().int().min(2).optional().catch(undefined),
  /** Timeline filter; all when absent. */
  show: z.enum(TIMELINE_FILTERS).optional().catch(undefined),
  tab: z
    .enum([...CAR_TABS, ...LEGACY_TAB_NAMES])
    .catch("overview")
    .default("overview"),
});

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
        onValueChange={(value: string) => {
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
        <TabsContent value="timeline">
          <TimelineTab carId={carId} readOnly={readOnly} />
        </TabsContent>
        <TabsContent value="reminders">
          <RemindersTab carId={carId} readOnly={readOnly} />
        </TabsContent>
        <TabsContent value="details">
          <DetailsStatsTab car={car} carId={carId} />
        </TabsContent>
      </Tabs>
    </>
  );
};

export const Route = createFileRoute("/_app/garage/cars/$carId/")({
  validateSearch: searchSchema,
  beforeLoad: ({ params, search }) => {
    const legacy = legacyCarTab(search.tab);

    if (legacy !== undefined) {
      throw redirect({
        params,
        replace: true,
        search: {
          ...search,
          show: search.show ?? legacy.show,
          tab: legacy.tab,
        },
        to: "/garage/cars/$carId",
      });
    }
  },
  loader: async ({ context, params }) => {
    await context.queryClient.query(carQuery(params.carId));
  },
  component: CarPage,
});
