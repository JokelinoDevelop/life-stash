import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import { withoutFinanceDialog } from "./finance-dialog-search";
import type { FinanceDialogTarget } from "./finance-dialog-search";
import { prefetchFinanceDialog } from "./prefetch-finance-dialog";

/**
 * A link that opens a Finances dialog over the current page (⌘-click opens a new tab).
 * Its data starts loading on touch / hover, so the dialog usually opens with the form ready.
 */
export const FinanceDialogLink = ({
  entry,
  onPointerDown,
  onPointerEnter,
  ...props
}: Omit<ComponentProps<"a">, "href"> & { entry: FinanceDialogTarget }) => {
  const client = useQueryClient();

  const prefetch = () => {
    void prefetchFinanceDialog(client, entry);
  };

  return (
    <Link
      {...props}
      onPointerDown={(event) => {
        prefetch();
        onPointerDown?.(event);
      }}
      onPointerEnter={(event) => {
        prefetch();
        onPointerEnter?.(event);
      }}
      search={(prev) => ({ ...withoutFinanceDialog(prev), ...entry })}
      state={{ entryDialog: true }}
      to="."
    />
  );
};
