import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import { withoutEntryDialog } from "./entry-dialog-search";
import type { EntryDialogTarget } from "./entry-dialog-search";
import { prefetchEntryDialog } from "./prefetch-entry-dialog";

/**
 * A link that opens a create/edit dialog over the current page (⌘-click opens it in a new tab).
 * Its data starts loading on touch / hover, so the dialog usually opens with the form ready.
 */
export const EntryDialogLink = ({
  entry,
  onPointerDown,
  onPointerEnter,
  ...props
}: Omit<ComponentProps<"a">, "href"> & { entry: EntryDialogTarget }) => {
  const client = useQueryClient();

  const prefetch = () => {
    void prefetchEntryDialog(client, entry);
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
      search={(prev) => ({ ...withoutEntryDialog(prev), ...entry })}
      state={{ entryDialog: true }}
      to="."
    />
  );
};
