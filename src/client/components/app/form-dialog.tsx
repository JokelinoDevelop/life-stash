import { ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import { FormDialogContext } from "./form-dialog-context";
import type { FormDialogControls } from "./form-dialog-context";
import { useIsDesktop } from "./responsive-dialog";

const FOCUSABLE =
  "input:not([type=hidden]):not([disabled]), textarea:not([disabled]), button[role=combobox]:not([disabled])";

/** Open on the first field instead of the header's close button. */
const firstField = (popup: HTMLElement | null) =>
  popup?.querySelector<HTMLElement>(FOCUSABLE) ?? true;

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Desktop crumb before the title, e.g. the car monogram and name. */
  crumb?: ReactNode;
  /** `full`: a near-full-screen dialog on desktop and a full-height sheet on phones. */
  size?: "md" | "lg" | "full";
  /** A `DialogForm` (scrolling body + pinned footer), a skeleton or an error. */
  children: ReactNode;
}

const DesktopFormDialog = ({
  children,
  crumb,
  description,
  onOpenChange,
  open,
  size,
  title,
}: FormDialogProps) => {
  const { t } = useTranslation();
  const popupRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        initialFocus={() => firstField(popupRef.current)}
        ref={popupRef}
        showCloseButton={false}
        size={size}
        variant="bare"
      >
        <div className="flex h-11 shrink-0 items-center justify-between pr-2 pl-4 md:h-13 md:pr-3 md:pl-6">
          <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
            {crumb !== undefined && (
              <>
                {crumb}
                <ChevronRight aria-hidden="true" className="size-3 shrink-0" />
              </>
            )}
            <DialogTitle variant="crumb">{title}</DialogTitle>
          </div>
          <DialogClose
            render={
              <Button
                aria-label={t("actions.close")}
                size="icon-compact"
                variant="ghost"
              />
            }
          >
            <X />
          </DialogClose>
        </div>
        <DialogDescription className="sr-only">
          {description ?? title}
        </DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
};

const MobileFormDialog = ({
  children,
  description,
  onOpenChange,
  open,
  size,
  title,
}: FormDialogProps) => (
  <Drawer onOpenChange={onOpenChange} open={open} repositionInputs={false}>
    <DrawerContent
      className={size === "full" ? "h-[96dvh] max-h-[96dvh]" : "max-h-[92dvh]"}
    >
      <DrawerHeader align="start">
        <DrawerTitle>{title}</DrawerTitle>
        <DrawerDescription className="sr-only">
          {description ?? title}
        </DrawerDescription>
      </DrawerHeader>
      {children}
    </DrawerContent>
  </Drawer>
);

const DiscardConfirm = ({
  onDiscard,
  onKeep,
  open,
}: {
  onDiscard: () => void;
  onKeep: () => void;
  open: boolean;
}) => {
  const { t } = useTranslation();

  return (
    <AlertDialog
      onOpenChange={(next) => {
        if (!next) {
          onKeep();
        }
      }}
      open={open}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("discard.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("discard.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("discard.keep")}</AlertDialogCancel>
          <AlertDialogAction onClick={onDiscard} variant="destructive">
            {t("discard.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

/**
 * Create/edit forms: a dialog on desktop (crumb › title, close) and a bottom
 * sheet on phones. The form brings its own scrolling body and footer.
 * Closing with unsaved changes (Esc, ×, outside click, swipe, Cancel, or a
 * link via `requestLeave`) asks once. After Discard, or once it is leaving,
 * further close events (a sheet fires its own as it animates out) are ignored,
 * so the question never comes back and the dialog never closes twice.
 */
export const FormDialog = ({
  onOpenChange,
  open,
  ...props
}: FormDialogProps) => {
  const isDesktop = useIsDesktop();
  const [confirming, setConfirming] = useState(false);

  // Refs, not state: close events arrive from several layers in one tap.
  const dirty = useRef(false);
  const leaving = useRef(false);
  const onOpenChangeRef = useRef(onOpenChange);
  const pendingLeave = useRef<(() => void) | null>(null);

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });

  // Each time it opens, start fresh (the host may reuse this instance).
  useEffect(() => {
    if (open) {
      leaving.current = false;
      dirty.current = false;
    }
  }, [open]);

  // Stable, so the footer's dirty report doesn't re-run on every render.
  const controls = useMemo<FormDialogControls>(() => {
    const leaveNow = (leave: () => void) => {
      if (leaving.current) {
        return;
      }

      leaving.current = true;
      leave();
    };

    const askBeforeLeaving = (leave: () => void) => {
      if (leaving.current) {
        return;
      }

      if (dirty.current) {
        pendingLeave.current = leave;
        setConfirming(true);
      } else {
        leaveNow(leave);
      }
    };

    return {
      requestClose: () => {
        askBeforeLeaving(() => {
          onOpenChangeRef.current(false);
        });
      },
      requestLeave: askBeforeLeaving,
      setDirty: (next) => {
        if (!leaving.current) {
          dirty.current = next;
        }
      },
    };
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      onOpenChange(true);
    } else {
      controls.requestClose();
    }
  };

  const Shell = isDesktop ? DesktopFormDialog : MobileFormDialog;

  return (
    <FormDialogContext value={controls}>
      <Shell {...props} onOpenChange={handleOpenChange} open={open} />
      <DiscardConfirm
        onDiscard={() => {
          setConfirming(false);
          dirty.current = false;
          leaving.current = true;
          pendingLeave.current?.();
          pendingLeave.current = null;
        }}
        onKeep={() => {
          setConfirming(false);
          pendingLeave.current = null;
        }}
        open={confirming}
      />
    </FormDialogContext>
  );
};
