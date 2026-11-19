import { CATEGORY_ICONS } from "@shared/domain/finances/kinds";
import type {
  CategoryIcon,
  TransactionKind,
} from "@shared/domain/finances/kinds";
import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";

import type { FinanceCategory } from "../../categories.queries";
import type { CategoryFormValues } from "./schema";

type CreateBody = InferRequestType<
  typeof api.finances.categories.$post
>["json"];

type UpdateBody = InferRequestType<
  (typeof api.finances.categories)[":categoryId"]["$patch"]
>["json"];

const isIcon = (value: string | null): value is CategoryIcon =>
  CATEGORY_ICONS.some((icon) => icon === value);

export const categoryFormDefaults = (
  kind: TransactionKind
): CategoryFormValues => ({
  icon: kind === "income" ? "hand-coins" : "receipt",
  name: "",
});

export const categoryToFormValues = (
  category: FinanceCategory
): CategoryFormValues => ({
  icon: isIcon(category.icon) ? category.icon : "receipt",
  name: category.name,
});

export const categoryFormToCreateRequest = (
  values: CategoryFormValues,
  forKind: TransactionKind
): CreateBody => ({
  icon: values.icon,
  kind: forKind,
  name: values.name.trim(),
});

export const categoryFormToUpdateRequest = (
  values: CategoryFormValues
): UpdateBody => ({ icon: values.icon, name: values.name.trim() });
