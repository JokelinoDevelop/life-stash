import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PageHeader, PageStack } from "@/components/app/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { carsQuery } from "@/modules/garage/cars/cars.queries";
import { householdOverviewQuery } from "@/modules/garage/household/household.queries";
import { ReminderGroups } from "@/modules/garage/household/reminder-groups";

const RemindersPage = () => {
  const { t } = useTranslation();
  const { t: tg } = useTranslation("garage");
  const overview = useQuery(householdOverviewQuery);
  const cars = useQuery(carsQuery(false));

  return (
    <>
      <PageHeader title={t("nav.reminders")} />
      {(overview.isPending || cars.isPending) && <LoadingState />}
      {overview.isError && (
        <ErrorState
          error={overview.error}
          onRetry={() => {
            void overview.refetch();
          }}
        />
      )}
      {overview.isSuccess && cars.isSuccess && (
        <PageStack>
          {overview.data.reminders.length === 0 ? (
            <EmptyState
              icon={<Bell className="size-8" />}
              message={tg("home.remindersEmpty")}
            />
          ) : (
            <ReminderGroups
              cars={cars.data.cars}
              reminders={overview.data.reminders}
            />
          )}
        </PageStack>
      )}
    </>
  );
};

export const Route = createFileRoute("/_app/garage/reminders")({
  component: RemindersPage,
});
