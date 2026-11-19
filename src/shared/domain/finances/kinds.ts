/** Fixed vocabularies of the Finances module, shared by worker and client. */
export const TRANSACTION_KINDS = ["income", "expense"] as const;

export type TransactionKind = (typeof TRANSACTION_KINDS)[number];

/** Categories the app relies on; they can't be renamed, archived or deleted. */
export const SYSTEM_CATEGORY_KEYS = ["invoices"] as const;

export type SystemCategoryKey = (typeof SYSTEM_CATEGORY_KEYS)[number];

/**
 * Lucide icon names a category may use. The client maps each to a component; anything else
 * falls back to a neutral dot.
 */
export const CATEGORY_ICONS = [
  "house",
  "shopping-cart",
  "zap",
  "coffee",
  "bus",
  "plane",
  "credit-card",
  "heart-pulse",
  "shopping-bag",
  "gift",
  "graduation-cap",
  "baby",
  "dumbbell",
  "wrench",
  "phone",
  "receipt",
  "file-text",
  "briefcase",
  "hand-coins",
  "piggy-bank",
  "circle-plus",
  "circle-ellipsis",
] as const;

export type CategoryIcon = (typeof CATEGORY_ICONS)[number];

/** `YYYY-MM` of an ISO date. */
export const monthOf = (date: string): string => date.slice(0, 7);
