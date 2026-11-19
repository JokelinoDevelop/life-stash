import type { FinanceCategory } from "../../../categories/categories.queries";

/** Active categories of a kind, ranked for the "Frequent" shortcuts. */
export const frequentCategories = (
  categories: readonly FinanceCategory[],
  limit = 5
): FinanceCategory[] =>
  categories
    .filter((category) => category.systemKey === null)
    .toSorted(
      (a, b) =>
        b.recentCount - a.recentCount ||
        b.entryCount - a.entryCount ||
        a.position - b.position
    )
    .slice(0, limit);

/** The categories a picker offers for a kind (and the entry's current one). */
export type OptionsFor = (
  kind: "income" | "expense",
  current: string
) => FinanceCategory[];

/** Placeholder for `withForm` prop typing; the real list comes from the form. */
export const noOptions: OptionsFor = () => [];
