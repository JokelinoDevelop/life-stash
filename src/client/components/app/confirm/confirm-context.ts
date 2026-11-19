import { createContext, useContext } from "react";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "destructive";
}

export type Confirm = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<Confirm | null>(null);

/** `confirm(options)` resolves true when the user confirms; mount `ConfirmProvider` once. */
export const useConfirm = (): Confirm => {
  const confirm = useContext(ConfirmContext);

  if (confirm === null) {
    throw new Error("useConfirm must be used inside ConfirmProvider");
  }

  return confirm;
};
