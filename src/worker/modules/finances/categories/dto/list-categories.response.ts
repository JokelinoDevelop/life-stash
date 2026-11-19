import type {
  SystemCategoryKey,
  TransactionKind,
} from "@shared/domain/finances/kinds";

import type { CategoryWithUsage } from "../categories.service";

export interface ListCategoriesResponse {
  categories: {
    id: string;
    kind: TransactionKind;
    name: string;
    icon: string | null;
    systemKey: SystemCategoryKey | null;
    position: number;
    archived: boolean;
    entryCount: number;
    recentCount: number;
  }[];
}

export const toListCategoriesResponse = (
  rows: readonly CategoryWithUsage[]
): ListCategoriesResponse => ({
  categories: rows.map((row) => ({
    archived: row.archivedAt !== null,
    entryCount: row.entryCount,
    icon: row.icon,
    id: row.id,
    kind: row.kind,
    name: row.name,
    position: row.position,
    recentCount: row.recentCount,
    systemKey: row.systemKey,
  })),
});
