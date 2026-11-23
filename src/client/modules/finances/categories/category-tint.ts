import type { CategoryIcon } from "@shared/domain/finances/kinds";

import type { Tint } from "@/components/app/tint";

/** Which tint each finance category icon gets (phones); unknown icons are neutral. */
const ICON_TINTS = {
  baby: "pink",
  briefcase: "purple",
  bus: "blue",
  "circle-plus": "green",
  coffee: "orange",
  "credit-card": "purple",
  dumbbell: "orange",
  "file-text": "slate",
  gift: "pink",
  "graduation-cap": "purple",
  "hand-coins": "green",
  "heart-pulse": "pink",
  house: "teal",
  phone: "blue",
  "piggy-bank": "pink",
  plane: "blue",
  receipt: "slate",
  "shopping-bag": "purple",
  "shopping-cart": "green",
  wrench: "amber",
  zap: "amber",
} as const satisfies Partial<Record<CategoryIcon, Tint>>;

const hasTint = (icon: string): icon is keyof typeof ICON_TINTS =>
  Object.hasOwn(ICON_TINTS, icon);

export const categoryTint = (icon: string | null): Tint =>
  icon !== null && hasTint(icon) ? ICON_TINTS[icon] : "slate";
