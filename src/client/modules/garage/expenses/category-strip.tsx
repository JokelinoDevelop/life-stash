import { useTranslation } from "react-i18next";

import { SectionHeading } from "@/components/app/list-section";
import { useFormat } from "@/lib/format";

import { CategoryIcon } from "./expense-category";
import type { CategoryTotal } from "./group-expenses";

/** This year's spend per category as one strip; it scrolls sideways on phones. */
export const CategoryStrip = ({
  categories,
}: {
  categories: CategoryTotal[];
}) => {
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
