import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFormat } from "@/lib/format";

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
    <div className="flex flex-col gap-4">
      {groupByMonth(expenses).map((group) => (
        <Card key={group.month}>
          <CardHeader>
            <CardTitle>
              <span className="capitalize">
                {monthFormat.format(new Date(`${group.month}-01T00:00:00Z`))}
              </span>
            </CardTitle>
            <CardAction>
              <span className="text-muted-foreground text-sm tabular-nums">
                {format.totals(group.totals)}
              </span>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y">
              {group.expenses.map((expense) => {
                const row = (
                  <>
                    <CategoryIcon category={expense.category} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {t(`categories.${expense.category}`)}
                      </p>
                      <p className="text-muted-foreground truncate text-sm">
                        {format.date(expense.date)}
                        {expense.quantityMilli !== null &&
                          ` · ${t("litres", { value: expense.quantityMilli / MILLI })}`}
                        {expense.odometerKm !== null &&
                          ` · ${format.distance(expense.odometerKm)}`}
                        {expense.notes !== null && ` · ${expense.notes}`}
                      </p>
                    </div>
                    <span className="shrink-0 font-medium tabular-nums">
                      {format.money(expense.amountMinor, expense.currency)}
                    </span>
                  </>
                );

                return (
                  <li key={expense.id}>
                    {readOnly ? (
                      <div className="flex items-center gap-3 py-2">{row}</div>
                    ) : (
                      <Link
                        className="flex items-center gap-3 py-2"
                        params={{ carId, expenseId: expense.id }}
                        to="/garage/cars/$carId/expenses/$expenseId/edit"
                      >
                        {row}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
