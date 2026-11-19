import { useQuery } from "@tanstack/react-query";
import { Plus, Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";

import { SectionHeading } from "@/components/app/list-section";
import { PageStack } from "@/components/app/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";
import { CAR_SHORTCUTS } from "@/lib/shortcuts";

import { EntryDialogLink } from "../entry-dialogs/entry-dialog-link";
import { CategoryIcon } from "./expense-category";
import { ExpenseList } from "./expense-list";
import { expensesQuery } from "./expenses.queries";
import { totalsByCategory } from "./group-expenses";
import type { CategoryTotal } from "./group-expenses";

/** This year's spend per category as one strip; it scrolls sideways on phones. */
const CategoryStrip = ({ categories }: { categories: CategoryTotal[] }) => {
  const { t } = useTranslation("garageExpenses");
  const format = useFormat();

  return (
    <section className="flex flex-col gap-2">
      <SectionHeading title={t("thisYear")} />
      {categories.length === 0 ? (
        <p className="text-muted-foreground px-0.5 text-sm">
          {t("noneThisYear")}
        </p>
      ) : (
        <div className="-mx-4 scrollbar-none overflow-x-auto px-4 md:mx-0 md:px-0">
          <ul className="bg-card divide-divider flex w-max min-w-full divide-x rounded-lg border">
            {categories.map((entry) => (
              <li
                className="flex min-w-32 flex-1 items-center gap-2.5 px-3 py-2.5"
                key={entry.category}
              >
                <CategoryIcon category={entry.category} />
                <div className="flex min-w-0 flex-col">
                  <span className="text-muted-foreground truncate text-xs">
                    {t(`categories.${entry.category}`)}
                  </span>
                  <span className="text-sm font-medium whitespace-nowrap tabular-nums">
                    {format.totals(entry.totals)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export const ExpensesTab = ({
  carId,
  readOnly,
}: {
  carId: string;
  readOnly: boolean;
}) => {
  const { t } = useTranslation("garageExpenses");
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
      <EntryDialogLink entry={{ car: carId, dialog: "expense" }}>
        <Plus />
        {t("add")}
        <Kbd className="hidden md:inline-flex">
          {CAR_SHORTCUTS.addExpense.toUpperCase()}
        </Kbd>
      </EntryDialogLink>
    </Button>
  );

  if (list.length === 0) {
    return (
      <PageStack>
        <EmptyState
          action={addButton}
          icon={<Receipt />}
          message={t("empty")}
        />
      </PageStack>
    );
  }

  return (
    <PageStack>
      {addButton !== null && (
        <div className="flex justify-end">{addButton}</div>
      )}
      <CategoryStrip categories={categories} />
      <ExpenseList carId={carId} expenses={list} readOnly={readOnly} />
    </PageStack>
  );
};
