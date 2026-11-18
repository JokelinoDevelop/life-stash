import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";
import { emptyToNull } from "@/lib/form-schemas";

import type { CatalogPackage } from "../../catalog.queries";
import type { PackageFormValues } from "./schema";

type PackageBody = InferRequestType<typeof api.garage.packages.$post>["json"];

export const packageFormDefaults = (
  pkg?: CatalogPackage
): PackageFormValues => ({
  itemIds: pkg?.itemIds ?? [],
  name: pkg?.name ?? "",
  notes: pkg?.notes ?? "",
});

export const packageFormToRequest = (
  values: PackageFormValues
): PackageBody => ({
  itemIds: values.itemIds,
  name: values.name.trim(),
  notes: emptyToNull(values.notes),
});
