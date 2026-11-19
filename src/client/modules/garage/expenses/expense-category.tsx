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

const CATEGORY_ICONS: Record<ExpenseCategory, LucideIcon> = {
  fuel: Fuel,
  insurance: ShieldCheck,
  other: Ellipsis,
  parking: SquareParking,
  registration: FileBadge,
  tolls: Milestone,
};

export const CategoryIcon = ({ category }: { category: ExpenseCategory }) => {
  const Icon = CATEGORY_ICONS[category];

  return (
    <span
      aria-hidden="true"
      className="bg-muted text-subtle-foreground flex size-8 shrink-0 items-center justify-center rounded-md border md:size-7"
    >
      <Icon className="size-4 md:size-3.5" />
    </span>
  );
};
