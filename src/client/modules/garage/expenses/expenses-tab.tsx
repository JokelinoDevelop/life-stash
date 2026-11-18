import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Plus, Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";

import { CategoryIcon } from "./expense-category";
import { ExpenseList } from "./expense-list";
import { expensesQuery } from "./expenses.queries";
import { totalsByCategory } from "./group-expenses";

export const ExpensesTab = ({
  carId,
  readOnly,
}: {
  carId: string;
  readOnly: boolean;
}) => {
  const { t } = useTranslation("garageExpenses");
  const format = useFormat();
  const expenses = useQuery(expensesQuery(carId));

  if (expenses.isPending) {
    return <LoadingState rows={3} />;
  }

  if (expenses.isError) {
    return (
      <ErrorState
        error={expenses.error}
        onRetry={() => {
          void expenses.refetch();
        }}
      />
    );
  }

  const list = expenses.data.expenses;
  const categories = totalsByCategory(list, Number(todayIso().slice(0, 4)));

  const addButton = readOnly ? null : (
    <Button asChild>
      <Link params={{ carId }} to="/garage/cars/$carId/expenses/new">
        <Plus />
        {t("add")}
      </Link>
    </Button>
  );

  if (list.length === 0) {
    return (
      <EmptyState
        action={addButton}
        icon={<Receipt className="size-10" />}
        message={t("empty")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {addButton !== null && (
        <div className="flex justify-end">{addButton}</div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>{t("thisYear")}</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noneThisYear")}</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((entry) => (
                <li className="flex items-center gap-3" key={entry.category}>
                  <CategoryIcon category={entry.category} />
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-sm">
                      {t(`categories.${entry.category}`)}
                    </p>
                    <p className="font-semibold tabular-nums">
                      {format.totals(entry.totals)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <ExpenseList carId={carId} expenses={list} readOnly={readOnly} />
    </div>
  );
};
