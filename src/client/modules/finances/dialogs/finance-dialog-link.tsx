import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import { withoutFinanceDialog } from "./finance-dialog-search";
import type { FinanceDialogTarget } from "./finance-dialog-search";

/** A link that opens a Finances dialog over the current page (⌘-click opens a new tab). */
export const FinanceDialogLink = ({
  entry,
  ...props
}: Omit<ComponentProps<"a">, "href"> & { entry: FinanceDialogTarget }) => (
  <Link
    {...props}
    search={(prev) => ({ ...withoutFinanceDialog(prev), ...entry })}
    state={{ entryDialog: true }}
    to="."
  />
);
