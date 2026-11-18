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
    <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
      <Icon className="size-4" />
    </div>
  );
};
