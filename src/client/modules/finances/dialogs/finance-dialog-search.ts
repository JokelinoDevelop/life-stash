import { TRANSACTION_KINDS } from "@shared/domain/finances/kinds";
import { z } from "zod";

import type { AppDialog } from "@/app/dialogs";

export const FINANCE_DIALOGS = [
  "transaction",
  "category",
] as const satisfies readonly AppDialog[];

export type FinanceDialogKind = (typeof FINANCE_DIALOGS)[number];

const optionalId = z.string().min(1).optional().catch(undefined);

/**
 * Finance search keys next to `dialog` and `id` (shared with Garage):
 * - `entryKind`: income or expense, for a new transaction or category (not `kind`,
 *   which list pages use as a filter).
 * - `duplicate`: a transaction to copy into a new one.
 */
export const financeDialogSearchFields = {
  duplicate: optionalId,
  entryKind: z.enum(TRANSACTION_KINDS).optional().catch(undefined),
};

export type FinanceDialogTarget =
  | {
      dialog: "transaction";
      id?: string;
      entryKind?: "income" | "expense";
      duplicate?: string;
    }
  | { dialog: "category"; id?: string; entryKind?: "income" | "expense" };

export interface FinanceDialogSearch {
  dialog?: AppDialog;
  id?: string;
  entryKind?: "income" | "expense";
  duplicate?: string;
}

export const isFinanceDialog = (
  dialog: AppDialog | undefined
): dialog is FinanceDialogKind =>
  FINANCE_DIALOGS.some((name) => name === dialog);

/** The given search without any finance dialog keys, so the dialog closes. */
export const withoutFinanceDialog = <T extends FinanceDialogSearch>(
  search: T
): Omit<T, keyof FinanceDialogSearch> => {
  const {
    dialog: _dialog,
    duplicate: _duplicate,
    id: _id,
    entryKind: _entryKind,
    ...rest
  } = search;

  return rest;
};
