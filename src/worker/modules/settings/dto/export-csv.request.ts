import { z } from "zod";

export const EXPORT_DATASETS = [
  "service-history",
  "mileage",
  "expenses",
  "reminders",
] as const;

export type ExportDataset = (typeof EXPORT_DATASETS)[number];

export const exportCsvParams = z.object({
  dataset: z.enum(EXPORT_DATASETS),
});
