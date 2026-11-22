import type {
  CategoryIcon,
  SystemCategoryKey,
  TransactionKind,
} from "@shared/domain/finances/kinds";

import type { Db } from "../../../core/db";
import { CategoriesRepository } from "./categories.repository";
import type { NewCategory } from "./categories.repository";

export interface DefaultCategory {
  kind: TransactionKind;
  icon: CategoryIcon;
  name: { en: string; mk: string };
  systemKey?: SystemCategoryKey;
}

/** Starter categories every household gets at setup; everything but Invoices is editable. */
export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  { icon: "house", kind: "expense", name: { en: "Rent", mk: "Кирија" } },
  {
    icon: "shopping-cart",
    kind: "expense",
    name: { en: "Groceries", mk: "Намирници" },
  },
  { icon: "zap", kind: "expense", name: { en: "Utilities", mk: "Комуналии" } },
  {
    icon: "coffee",
    kind: "expense",
    name: { en: "Eating out", mk: "Ресторани" },
  },
  { icon: "bus", kind: "expense", name: { en: "Transport", mk: "Превоз" } },
  { icon: "plane", kind: "expense", name: { en: "Travel", mk: "Патувања" } },
  {
    icon: "credit-card",
    kind: "expense",
    name: { en: "Subscriptions", mk: "Претплати" },
  },
  {
    icon: "heart-pulse",
    kind: "expense",
    name: { en: "Health", mk: "Здравје" },
  },
  {
    icon: "shopping-bag",
    kind: "expense",
    name: { en: "Shopping", mk: "Шопинг" },
  },
  {
    icon: "circle-ellipsis",
    kind: "expense",
    name: { en: "Other", mk: "Друго" },
  },
  {
    icon: "file-text",
    kind: "income",
    name: { en: "Invoices", mk: "Фактури" },
    systemKey: "invoices",
  },
  { icon: "briefcase", kind: "income", name: { en: "Salary", mk: "Плата" } },
  {
    icon: "hand-coins",
    kind: "income",
    name: { en: "Freelance", mk: "Хонорари" },
  },
  {
    icon: "circle-plus",
    kind: "income",
    name: { en: "Other income", mk: "Друг приход" },
  },
];

/** The defaults as rows, named in `locale` and numbered per kind. */
export const defaultCategoryRows = (locale: "en" | "mk"): NewCategory[] => {
  const positions = { expense: 0, income: 0 };

  return DEFAULT_CATEGORIES.map((category) => {
    const nextPosition = positions[category.kind];
    positions[category.kind] += 1;

    return {
      icon: category.icon,
      kind: category.kind,
      name: category.name[locale],
      position: nextPosition,
      systemKey: category.systemKey ?? null,
    };
  });
};

/** Gives a new household its default categories (called from account setup). */
export const seedDefaultCategories = async (
  db: Db,
  householdId: string,
  locale: "en" | "mk" = "en"
): Promise<void> => {
  await new CategoriesRepository(db, householdId).insertMany(
    defaultCategoryRows(locale)
  );
};
