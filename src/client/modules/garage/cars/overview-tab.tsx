import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BellPlus, Fuel, Gauge, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";

import { carOverviewQuery } from "./cars.queries";
import { DueNextCard, RecentVisitsCard, StatsPanel } from "./overview-cards";

const QuickActions = ({ carId }: { carId: string }) => {
  const { t } = useTranslation("garage");

  return (
    <div className="-mx-4 flex scrollbar-none gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
      <Button asChild size="compact" variant="outline">
        <Link params={{ carId }} to="/garage/cars/$carId/services/new">
          <Wrench />
          {t("quickActions.service")}
        </Link>
      </Button>
      <Button asChild size="compact" variant="outline">
        <Link
          params={{ carId }}
          search={{ log: true, tab: "mileage" }}
          to="/garage/cars/$carId"
        >
          <Gauge />
          {t("quickActions.odometer")}
        </Link>
      </Button>
      <Button asChild size="compact" variant="outline">
        <Link params={{ carId }} to="/garage/cars/$carId/expenses/new">
          <Fuel />
          {t("quickActions.expense")}
        </Link>
      </Button>
      <Button asChild size="compact" variant="outline">
        <Link params={{ carId }} to="/garage/cars/$carId/reminders/new">
          <BellPlus />
          {t("quickActions.reminder")}
        </Link>
      </Button>
    </div>
  );
};

/** Answers the four questions at a glance: what's due, what's done, how far, how much. */
export const OverviewTab = ({
  carId,
  readOnly,
}: {
  carId: string;
  readOnly: boolean;
}) => {
  const overview = useQuery(carOverviewQuery(carId));

  if (overview.isPending) {
    return <LoadingState rows={4} />;
  }

  if (overview.isError) {
    return (
      <ErrorState
        error={overview.error}
        onRetry={() => {
          void overview.refetch();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {!readOnly && <QuickActions carId={carId} />}
      <StatsPanel overview={overview.data} />
      <div className="grid gap-6 lg:grid-cols-2">
        <DueNextCard
          carId={carId}
          readOnly={readOnly}
          reminders={overview.data.dueReminders}
        />
        <RecentVisitsCard carId={carId} visits={overview.data.recentVisits} />
      </div>
    </div>
  );
};
