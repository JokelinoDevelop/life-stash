import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import { withoutEntryDialog } from "./entry-dialog-search";
import type { EntryDialogTarget } from "./entry-dialog-search";

/** A link that opens a create/edit dialog over the current page (⌘-click opens it in a new tab). */
export const EntryDialogLink = ({
  entry,
  ...props
}: Omit<ComponentProps<"a">, "href"> & { entry: EntryDialogTarget }) => (
  <Link
    {...props}
    search={(prev) => ({ ...withoutEntryDialog(prev), ...entry })}
    state={{ entryDialog: true }}
    to="."
  />
);
