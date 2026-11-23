import type { ReactElement } from "react";

import { SwipeActions } from "@/components/app/swipe-actions";

/**
 * Phones: swipe a row left to reveal Delete; tapping it deletes (an Undo toast follows).
 * Desktop renders the row as is.
 */
export const SwipeToDelete = ({
  children,
  label,
  onDelete,
}: {
  children: ReactElement;
  label: string;
  onDelete: () => void;
}) => (
  <SwipeActions actions={[{ label, onSelect: onDelete, tone: "destructive" }]}>
    {children}
  </SwipeActions>
);
