import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  ListRow,
  ListRowText,
  ListSection,
} from "@/components/app/list-section";
import { useFormat } from "@/lib/format";

import { EntryDialogLink } from "../entry-dialogs/entry-dialog-link";
import { CategoryIcon } from "./expense-category";
import type { ExpenseListItem } from "./expenses.queries";
import { groupByMonth } from "./group-expenses";

const MILLI = 1000;

export const ExpenseList = ({
  carId,
  expenses,
  readOnly,
}: {
  carId: string;
  expenses: ExpenseListItem[];
  readOnly: boolean;
}) => {
  const { t, i18n } = useTranslation("garageExpenses");
  const format = useFormat();

  const monthFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language === "mk" ? "mk-MK" : "en-GB", {
        month: "long",
        timeZone: "UTC",
        year: "numeric",
      }),
    [i18n.language]
  );

  return (
    <div className="flex flex-col gap-6 md:gap-0" data-bleed="">
      {groupByMonth(expenses).map((group) => (
        <ListSection
          action={
            <span className="text-muted-foreground text-sm tabular-nums">
              {format.totals(group.totals)}
            </span>
          }
          count={group.expenses.length}
          key={group.month}
          title={
            <span className="capitalize">
              {monthFormat.format(new Date(`${group.month}-01T00:00:00Z`))}
            </span>
          }
        >
          {group.expenses.map((expense) => {
            const meta = [
              format.date(expense.date),
              expense.quantityMilli === null
                ? null
                : t("litres", { value: expense.quantityMilli / MILLI }),
              expense.odometerKm === null
                ? null
                : format.distance(expense.odometerKm),
              expense.notes,
            ]
              .filter((part) => part !== null)
              .join(" · ");

            const row = (
              <>
                <CategoryIcon category={expense.category} />
                <ListRowText
                  meta={<span className="tabular-nums">{meta}</span>}
                  title={t(`categories.${expense.category}`)}
                />
                <span className="shrink-0 font-medium tabular-nums">
                  {format.money(expense.amountMinor, expense.currency)}
                </span>
              </>
            );

            return readOnly ? (
              <ListRow className="py-2 md:py-1.5" key={expense.id}>
                {row}
              </ListRow>
            ) : (
              <ListRow asChild className="py-2 md:py-1.5" key={expense.id}>
                <EntryDialogLink
                  entry={{ car: carId, dialog: "expense", id: expense.id }}
                >
                  {row}
                </EntryDialogLink>
              </ListRow>
            );
          })}
        </ListSection>
      ))}
    </div>
  );
};
