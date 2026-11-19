import type {
  CategoryIcon,
  SystemCategoryKey,
  TransactionKind,
} from "@shared/domain/finances/kinds";

export interface DefaultCategory {
  kind: TransactionKind;
  icon: CategoryIcon;
  name: { en: string; mk: string };
  systemKey?: SystemCategoryKey;
}

/** Starter categories for a household's first visit to Finances; everything but Invoices is editable. */
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
