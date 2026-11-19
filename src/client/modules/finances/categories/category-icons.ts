import type { CategoryIcon as CategoryIconName } from "@shared/domain/finances/kinds";
import {
  Baby,
  Briefcase,
  Bus,
  CircleEllipsis,
  CirclePlus,
  Coffee,
  CreditCard,
  Dumbbell,
  FileText,
  Gift,
  GraduationCap,
  HandCoins,
  HeartPulse,
  House,
  Phone,
  PiggyBank,
  Plane,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Wrench,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const CATEGORY_ICON_COMPONENTS: Record<CategoryIconName, LucideIcon> = {
  baby: Baby,
  briefcase: Briefcase,
  bus: Bus,
  "circle-ellipsis": CircleEllipsis,
  "circle-plus": CirclePlus,
  coffee: Coffee,
  "credit-card": CreditCard,
  dumbbell: Dumbbell,
  "file-text": FileText,
  gift: Gift,
  "graduation-cap": GraduationCap,
  "hand-coins": HandCoins,
  "heart-pulse": HeartPulse,
  house: House,
  phone: Phone,
  "piggy-bank": PiggyBank,
  plane: Plane,
  receipt: Receipt,
  "shopping-bag": ShoppingBag,
  "shopping-cart": ShoppingCart,
  wrench: Wrench,
  zap: Zap,
};

const isIconName = (value: string): value is CategoryIconName =>
  Object.hasOwn(CATEGORY_ICON_COMPONENTS, value);

export const iconFor = (name: string | null): LucideIcon =>
  name !== null && isIconName(name) ? CATEGORY_ICON_COMPONENTS[name] : Tag;
