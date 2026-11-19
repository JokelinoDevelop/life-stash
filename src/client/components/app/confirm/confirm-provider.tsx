import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { ConfirmContext } from "./confirm-context";
import type { Confirm, ConfirmOptions } from "./confirm-context";

/**
 * Imperative yes/no questions: `await confirm({ title, tone })`. One question at a time; a
 * second call while one is open answers the first with `false`. Focus starts on Cancel.
 */
export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [open, setOpen] = useState(false);
  const resolver = useRef<((answer: boolean) => void) | null>(null);

  const settle = (answer: boolean) => {
    resolver.current?.(answer);
    resolver.current = null;
    setOpen(false);
  };

  const confirm = useCallback<Confirm>(
    async (next) =>
      // The promise is the API: it settles when the user answers the dialog.
      // oxlint-disable-next-line promise/avoid-new
      await new Promise<boolean>((resolve) => {
        resolver.current?.(false);
        resolver.current = resolve;
        setOptions(next);
        setOpen(true);
      }),
    []
  );

  const destructive = options?.tone === "destructive";

  return (
    <ConfirmContext value={confirm}>
      {children}
      <AlertDialog
        onOpenChange={(next) => {
          if (!next) {
            settle(false);
          }
        }}
        open={open}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options?.title}</AlertDialogTitle>
            {options?.description === undefined ? (
              <AlertDialogDescription className="sr-only">
                {options?.title}
              </AlertDialogDescription>
            ) : (
              <AlertDialogDescription>
                {options.description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel autoFocus>
              {options?.cancelLabel ?? t("actions.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                settle(true);
              }}
              variant={destructive ? "destructive" : "default"}
            >
              {options?.confirmLabel ??
                (destructive ? t("actions.delete") : t("actions.confirm"))}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext>
  );
};
