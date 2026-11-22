import { REMINDER_HORIZONS } from "@shared/domain/reminders";
import type { ReminderHorizon } from "@shared/domain/reminders";
import { useQuery } from "@tanstack/react-query";
import { CircleCheck } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  ListRow,
  ListRowText,
  ListSection,
} from "@/components/app/list-section";
import { PageStack } from "@/components/app/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { todayIso } from "@/lib/partial-date";
import { cn } from "@/lib/utils";
import { FinanceDialogLink } from "@/modules/finances/dialogs/finance-dialog-link";
import { InvoiceStatusIcon } from "@/modules/finances/invoices/invoice-status-icon";
import { useLedgerMoney } from "@/modules/finances/money";
import { overviewQuery } from "@/modules/finances/overview/overview.queries";
import type { FinanceOverview } from "@/modules/finances/overview/overview.queries";
import { ToConfirm } from "@/modules/finances/overview/to-confirm";
import type { CarListItem } from "@/modules/garage/cars/car-row";
import { carsQuery } from "@/modules/garage/cars/cars.queries";
import { householdOverviewQuery } from "@/modules/garage/household/household.queries";
import type { HouseholdReminder } from "@/modules/garage/household/household.queries";
import { ReminderRow } from "@/modules/garage/household/reminder-groups";

import { daysUntil, groupTodayItems } from "./today-groups";
import type { TodayItem } from "./today-groups";

type Waiting = FinanceOverview["waiting"][number];

type Item = TodayItem<HouseholdReminder, Waiting>;

/** "Later" shows this many rows until "Show all". */
const LATER_PREVIEW = 3;

const InvoiceRow = ({
  invoice,
  today,
}: {
  invoice: Waiting;
  today: string;
}) => {
  const { t } = useTranslation("today");
  const { t: tf } = useTranslation("finances");
  const ledger = useLedgerMoney();
  const overdue = invoice.status === "overdue";
  const days = daysUntil(invoice.dueDate, today);

  const upcoming =
    days <= 0 ? tf("overview.dueToday") : tf("overview.dueIn", { count: days });

  const when = overdue
    ? tf("invoices.daysLate", { count: invoice.daysOverdue })
    : upcoming;

  return (
    <ListRow
      render={
        <FinanceDialogLink entry={{ dialog: "invoice", id: invoice.id }} />
      }
    >
      <InvoiceStatusIcon status={invoice.status} />
      <ListRowText
        meta={t("invoiceMeta", { number: invoice.number })}
        title={invoice.clientName}
      />
      <span
        className={cn(
          "shrink-0 text-sm tabular-nums",
          overdue ? "text-destructive font-medium" : "text-muted-foreground"
        )}
      >
        {when}
      </span>
      <span className="hidden w-24 shrink-0 text-right font-medium tabular-nums md:block">
        {ledger.money(invoice.amountMinor, invoice.currency)}
      </span>
    </ListRow>
  );
};

const ItemRow = ({
  cars,
  item,
  today,
}: {
  cars: readonly CarListItem[];
  item: Item;
  today: string;
}) =>
  item.kind === "reminder" ? (
    <ReminderRow
      car={cars.find((car) => car.id === item.reminder.carId)}
      reminder={item.reminder}
    />
  ) : (
    <InvoiceRow invoice={item.invoice} today={today} />
  );

const itemKey = (item: Item): string =>
  item.kind === "reminder"
    ? `reminder-${item.reminder.id}`
    : `invoice-${item.invoice.id}`;

const HorizonSection = ({
  cars,
  horizon,
  items,
  today,
}: {
  cars: readonly CarListItem[];
  horizon: ReminderHorizon;
  items: Item[];
  today: string;
}) => {
  const { t } = useTranslation("today");
  const { t: tc } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const capped = horizon === "later" && !showAll;
  const shown = capped ? items.slice(0, LATER_PREVIEW) : items;
  const hidden = items.length - shown.length;

  return (
    <ListSection count={items.length} title={t(`horizons.${horizon}`)}>
      {shown.map((item) => (
        <ItemRow cars={cars} item={item} key={itemKey(item)} today={today} />
      ))}
      {(hidden > 0 || showAll) && (
        <li className="flex min-h-11 items-center px-1.5 md:min-h-10 md:px-3.5">
          <Button
            onClick={() => {
              setShowAll((value) => !value);
            }}
            size="xs"
            variant="ghost"
          >
            {showAll
              ? tc("pagination.showLess")
              : tc("pagination.showAll", { count: items.length })}
          </Button>
        </li>
      )}
    </ListSection>
  );
};

/** Everything that needs you, across Garage and Finances. */
export const TodayView = () => {
  const { t } = useTranslation("today");
  const year = Number(todayIso().slice(0, 4));
  const household = useQuery(householdOverviewQuery);
  const cars = useQuery(carsQuery(false));
  const finances = useQuery(overviewQuery(year));

  if (household.isPending || cars.isPending || finances.isPending) {
    return <LoadingState />;
  }

  if (household.isError || cars.isError || finances.isError) {
    return (
      <ErrorState
        error={household.error ?? cars.error ?? finances.error}
        onRetry={() => {
          void household.refetch();
          void cars.refetch();
          void finances.refetch();
        }}
      />
    );
  }

  const { today } = household.data;

  const groups = groupTodayItems(
    household.data.reminders,
    finances.data.waiting,
    today
  );

  const nothing = groups.size === 0 && finances.data.toConfirm.length === 0;

  if (nothing) {
    return (
      <div className="md:p-5">
        <EmptyState
          icon={<CircleCheck />}
          message={t("empty")}
          title={t("emptyTitle")}
        />
      </div>
    );
  }

  return (
    <PageStack>
      <ToConfirm overview={finances.data} />
      {REMINDER_HORIZONS.map((horizon) => {
        const items = groups.get(horizon) ?? [];

        return items.length === 0 ? null : (
          <HorizonSection
            cars={cars.data.cars}
            horizon={horizon}
            items={items}
            key={horizon}
            today={today}
          />
        );
      })}
    </PageStack>
  );
};

/** Things that need action now: overdue or due-soon reminders, late invoices, income to confirm. */
export interface TodayCount {
  count: number;
  overdue: boolean;
}

export const useTodayCount = (): TodayCount => {
  const year = Number(todayIso().slice(0, 4));
  const household = useQuery(householdOverviewQuery);
  const finances = useQuery(overviewQuery(year));
  const reminders = household.data?.reminders ?? [];
  const waiting = finances.data?.waiting ?? [];

  const dueReminders = reminders.filter(
    (reminder) => reminder.status !== "upcoming"
  ).length;

  const lateInvoices = waiting.filter(
    (invoice) => invoice.status === "overdue"
  ).length;

  return {
    count: dueReminders + lateInvoices + (finances.data?.toConfirm.length ?? 0),
    overdue:
      lateInvoices > 0 ||
      reminders.some((reminder) => reminder.status === "overdue"),
  };
};
