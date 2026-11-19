import { useState } from "react";

import { CategoryDialog } from "../categories/category-dialog";
import { TransactionDialog } from "../transactions/transaction-dialog";
import { isFinanceDialog } from "./finance-dialog-search";
import type { FinanceDialogSearch } from "./finance-dialog-search";
import { useFinanceDialog, useFinanceDialogSearch } from "./use-finance-dialog";

const dialogKey = (search: FinanceDialogSearch): string =>
  `${search.dialog}:${search.id}:${search.entryKind}:${search.duplicate}`;

/**
 * Renders the Finances dialog the URL asks for over any page, and keeps the last one
 * mounted while it animates out (same approach as the Garage host).
 */
export const FinanceDialogHost = () => {
  const search = useFinanceDialogSearch();
  const { close } = useFinanceDialog();
  const [shown, setShown] = useState<FinanceDialogSearch | null>(null);
  const open = isFinanceDialog(search.dialog);

  // Derived state: remember the latest open dialog (set during render, no effect).
  if (open && (shown === null || dialogKey(search) !== dialogKey(shown))) {
    setShown(search);
  }

  const current = open ? search : shown;

  if (current === null) {
    return null;
  }

  const onOpenChange = (next: boolean) => {
    if (!next) {
      void close();
    }
  };

  const key = dialogKey(current);
  const common = { onClose: close, onOpenChange, open };

  if (current.dialog === "transaction") {
    return (
      <TransactionDialog
        duplicateId={current.duplicate}
        key={key}
        kind={current.entryKind}
        transactionId={current.id}
        {...common}
      />
    );
  }

  if (current.dialog === "category") {
    return (
      <CategoryDialog
        categoryId={current.id}
        key={key}
        kind={current.entryKind}
        {...common}
      />
    );
  }

  return null;
};
