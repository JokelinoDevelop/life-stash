import { Gauge, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PagedList } from "@/components/app/list-pagination";
import {
  ListRow,
  ListRowText,
  ListSection,
} from "@/components/app/list-section";
import { Money } from "@/components/app/money";
import { TINT_TILE } from "@/components/app/tint";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useFormat } from "@/lib/format";
import { paginate } from "@/lib/paginate";
import { cn } from "@/lib/utils";

import { useTabPage } from "../cars/use-tab-page";
import { EntryDialogLink } from "../entry-dialogs/entry-dialog-link";
import { CategoryIcon } from "../expenses/expense-category";
import type { ExpenseListItem } from "../expenses/expenses.queries";
import type { MileagePoint } from "../mileage/mileage.queries";
import { groupByYear } from "../visits/group-by-year";
import { VisitRow } from "../visits/visit-row";
import type { VisitListItem } from "../visits/visits.queries";
import { TIMELINE_FILTERS } from "./build-timeline";
import type { TimelineEntry, TimelineFilter } from "./build-timeline";

const MILLI = 1000;

const isFilter = (value: string): value is TimelineFilter =>
  TIMELINE_FILTERS.some((filter) => filter === value);

export const ExpenseRow = ({
  carId,
  expense,
  readOnly,
}: {
  carId: string;
  expense: ExpenseListItem;
  readOnly: boolean;
}) => {
  const { t } = useTranslation("garageExpenses");
  const format = useFormat();

  const meta = [
    format.shortDate(expense.date),
    expense.quantityMilli === null
      ? null
      : t("litres", { value: expense.quantityMilli / MILLI }),
    expense.odometerKm === null ? null : format.distance(expense.odometerKm),
    expense.notes,
  ]
    .filter((part) => part !== null)
    .join(" · ");

  return (
    <ListRow
      className="py-2 md:py-1.5"
      render={
        readOnly ? undefined : (
          <EntryDialogLink
            entry={{ car: carId, dialog: "expense", id: expense.id }}
          />
        )
      }
    >
      <CategoryIcon category={expense.category} />
      <ListRowText
        meta={<span className="tabular-nums">{meta}</span>}
        title={t(`categories.${expense.category}`)}
      />
      <Money
        amountMinor={expense.amountMinor}
        className="shrink-0 font-medium"
        currency={expense.currency}
      />
    </ListRow>
  );
};

export const ReadingRow = ({
  onDelete,
  onEdit,
  reading,
  readOnly,
}: {
  onDelete: () => void;
  onEdit: () => void;
  reading: MileagePoint;
  readOnly: boolean;
}) => {
  const { t } = useTranslation("garageMileage");
  const { t: tc } = useTranslation();
  const format = useFormat();

  const meta = [format.shortDate(reading.date), reading.notes]
    .filter((part) => part !== null && part !== "")
    .join(" · ");

  const body = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "bg-muted text-subtle-foreground flex size-7 shrink-0 items-center justify-center rounded-md border max-md:size-8 max-md:rounded-lg [&_svg]:size-3.5 max-md:[&_svg]:size-4",
          TINT_TILE.slate
        )}
      >
        <Gauge />
      </span>
      <ListRowText
        meta={<span className="tabular-nums">{meta}</span>}
        title={t("timelineTitle")}
      />
      <span className="shrink-0 font-medium tabular-nums">
        {format.distance(reading.odometerKm)}
      </span>
    </>
  );

  if (readOnly) {
    return <ListRow className="py-2 md:py-1.5">{body}</ListRow>;
  }

  return (
    <ListRow className="relative py-2 md:py-1.5">
      <button
        aria-label={tc("actions.edit")}
        className="absolute inset-0 outline-none focus-visible:ring-2"
        onClick={onEdit}
        type="button"
      />
      {body}
      <span className="bg-background absolute right-2 z-10 flex rounded-md opacity-0 transition-opacity group-focus-within/row:opacity-100 group-hover/row:opacity-100 md:right-3">
        <Button
          aria-label={tc("actions.delete")}
          onClick={onDelete}
          size="icon-compact"
          variant="ghost"
        >
          <Trash2 />
        </Button>
      </span>
    </ListRow>
  );
};

export const FilterBar = ({
  filter,
  onChange,
}: {
  filter: TimelineFilter;
  onChange: (filter: TimelineFilter) => void;
}) => {
  const { t } = useTranslation("garage");

  return (
    <div className="-mx-4 scrollbar-none overflow-x-auto px-4 md:mx-0 md:px-0">
      <ToggleGroup
        aria-label={t("timeline.filterLabel")}
        onValueChange={(values: string[]) => {
          const [next] = values;

          if (next !== undefined && isFilter(next)) {
            onChange(next);
          }
        }}
        value={[filter]}
        variant="segmented"
      >
        {TIMELINE_FILTERS.map((value) => (
          <ToggleGroupItem key={value} value={value}>
            {t(`timeline.filters.${value}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

type Entry = TimelineEntry<VisitListItem, ExpenseListItem, MileagePoint>;

/** One page of entries under year headings; a heading counts the whole year. */
export const TimelineList = ({
  carId,
  entries,
  onDeleteReading,
  onEditReading,
  readOnly,
}: {
  carId: string;
  entries: Entry[];
  onDeleteReading: (reading: MileagePoint) => void;
  onEditReading: (reading: MileagePoint) => void;
  readOnly: boolean;
}) => {
  const { page, setPage } = useTabPage();
  const slice = paginate(entries, page);

  const perYear = new Map(
    groupByYear(entries).map(([year, items]) => [year, items.length])
  );

  const row = (entry: Entry) => {
    if (entry.kind === "service") {
      return (
        <VisitRow carId={carId} key={entry.id} shortDate visit={entry.visit} />
      );
    }

    if (entry.kind === "expense") {
      return (
        <ExpenseRow
          carId={carId}
          expense={entry.expense}
          key={entry.id}
          readOnly={readOnly}
        />
      );
    }

    return (
      <ReadingRow
        key={entry.id}
        onDelete={() => {
          onDeleteReading(entry.reading);
        }}
        onEdit={() => {
          onEditReading(entry.reading);
        }}
        readOnly={readOnly}
        reading={entry.reading}
      />
    );
  };

  return (
    <PagedList onPageChange={setPage} slice={slice}>
      {groupByYear(slice.items).map(([year, items]) => (
        <ListSection count={perYear.get(year)} key={year} title={year}>
          {items.map(row)}
        </ListSection>
      ))}
    </PagedList>
  );
};
