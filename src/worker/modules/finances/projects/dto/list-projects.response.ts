import type { MoneyTotal } from "@shared/domain/money";

import type { ProjectSummary } from "../projects.service";

export interface ListProjectsResponse {
  projects: {
    id: string;
    clientId: string;
    name: string;
    status: "active" | "done";
    notes: string | null;
    invoiceCount: number;
    invoiced: MoneyTotal[];
    earned: MoneyTotal[];
  }[];
}

export const toListProjectsResponse = (
  rows: readonly ProjectSummary[]
): ListProjectsResponse => ({
  projects: rows.map((row) => ({
    clientId: row.clientId,
    earned: row.earned,
    id: row.id,
    invoiceCount: row.invoiceCount,
    invoiced: row.invoiced,
    name: row.name,
    notes: row.notes,
    status: row.status,
  })),
});
