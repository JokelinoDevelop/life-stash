import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import { withoutFitnessDialog } from "./fitness-dialog-search";
import type { FitnessDialogTarget } from "./fitness-dialog-search";
import { prefetchFitnessDialog } from "./prefetch-fitness-dialog";

/**
 * A link that opens a Fitness dialog over the current page (⌘-click opens a new tab).
 * Its data starts loading on touch / hover, so the dialog usually opens with the form ready.
 */
export const FitnessDialogLink = ({
  entry,
  onPointerDown,
  onPointerEnter,
  ...props
}: Omit<ComponentProps<"a">, "href"> & { entry: FitnessDialogTarget }) => {
  const client = useQueryClient();

  const prefetch = () => {
    void prefetchFitnessDialog(client, entry);
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
      search={(prev) => ({ ...withoutFitnessDialog(prev), ...entry })}
      state={{ entryDialog: true }}
      to="."
    />
  );
};
