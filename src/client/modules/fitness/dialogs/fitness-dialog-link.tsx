import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import { withoutFitnessDialog } from "./fitness-dialog-search";
import type { FitnessDialogTarget } from "./fitness-dialog-search";

/** A link that opens a Fitness dialog over the current page (⌘-click opens a new tab). */
export const FitnessDialogLink = ({
  entry,
  ...props
}: Omit<ComponentProps<"a">, "href"> & { entry: FitnessDialogTarget }) => (
  <Link
    {...props}
    search={(prev) => ({ ...withoutFitnessDialog(prev), ...entry })}
    state={{ entryDialog: true }}
    to="."
  />
);
