import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Plus, Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ListRow, ListSection } from "@/components/app/list-section";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
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
    <Button asChild size="compact">
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
    <div className="flex flex-col gap-6">
      {addButton !== null && (
        <div className="flex justify-end">{addButton}</div>
      )}
      <ListSection title={t("thisYear")}>
        {categories.length === 0 ? (
          <ListRow className="text-muted-foreground">
            {t("noneThisYear")}
          </ListRow>
        ) : (
          categories.map((entry) => (
            <ListRow className="py-2 md:py-1.5" key={entry.category}>
              <CategoryIcon category={entry.category} />
              <span className="min-w-0 flex-1 truncate font-medium">
                {t(`categories.${entry.category}`)}
              </span>
              <span className="shrink-0 font-medium tabular-nums">
                {format.totals(entry.totals)}
              </span>
            </ListRow>
          ))
        )}
      </ListSection>
      <ExpenseList carId={carId} expenses={list} readOnly={readOnly} />
    </div>
  );
};
