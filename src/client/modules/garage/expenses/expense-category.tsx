import type { ExpenseCategory } from "@shared/domain/garage-kinds";
import {
  Ellipsis,
  FileBadge,
  Fuel,
  Milestone,
  ShieldCheck,
  SquareParking,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { TINT_TILE } from "@/components/app/tint";
import type { Tint } from "@/components/app/tint";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<ExpenseCategory, LucideIcon> = {
  fuel: Fuel,
  insurance: ShieldCheck,
  other: Ellipsis,
  parking: SquareParking,
  registration: FileBadge,
  tolls: Milestone,
};

/** Phone tints per expense category (desktop stays neutral). */
const CATEGORY_TINTS: Record<ExpenseCategory, Tint> = {
  fuel: "orange",
  insurance: "blue",
  other: "slate",
  parking: "teal",
  registration: "purple",
  tolls: "amber",
};

export const CategoryIcon = ({ category }: { category: ExpenseCategory }) => {
  const Icon = CATEGORY_ICONS[category];

  return (
    <span
      aria-hidden="true"
      className={cn(
        "bg-muted text-subtle-foreground flex size-8 shrink-0 items-center justify-center rounded-md border max-md:rounded-lg md:size-7",
        TINT_TILE[CATEGORY_TINTS[category]]
      )}
    >
      <Icon className="size-4 md:size-3.5" />
    </span>
  );
};
