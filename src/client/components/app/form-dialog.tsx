import { ChevronRight, X } from "lucide-react";
import { useRef, useState } from "react";
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
const focusFirstField = (event: Event) => {
  const content = event.currentTarget;

  if (!(content instanceof HTMLElement)) {
    return;
  }

  const field = content.querySelector<HTMLElement>(FOCUSABLE);

  if (field !== null) {
    event.preventDefault();
    field.focus();
  }
};

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Desktop crumb before the title, e.g. the car monogram and name. */
  crumb?: ReactNode;
  size?: "md" | "lg";
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

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        onOpenAutoFocus={focusFirstField}
        showCloseButton={false}
        size={size}
        variant="bare"
      >
        <div className="flex h-11 shrink-0 items-center justify-between pr-2 pl-4">
          <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
            {crumb !== undefined && (
              <>
                {crumb}
                <ChevronRight aria-hidden="true" className="size-3 shrink-0" />
              </>
            )}
            <DialogTitle asChild>
              <h2 className="text-foreground truncate text-xs font-medium">
                {title}
              </h2>
            </DialogTitle>
          </div>
          <DialogClose asChild>
            <Button
              aria-label={t("actions.close")}
              size="icon-compact"
              variant="ghost"
            >
              <X />
            </Button>
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
  title,
}: FormDialogProps) => (
  <Drawer onOpenChange={onOpenChange} open={open} repositionInputs={false}>
    <DrawerContent className="max-h-[92dvh]">
      <DrawerHeader className="text-left">
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
 * Closing with unsaved changes (Esc, ×, outside click, Cancel) asks first.
 */
export const FormDialog = ({ onOpenChange, ...props }: FormDialogProps) => {
  const isDesktop = useIsDesktop();
  const dirty = useRef(false);
  const [confirming, setConfirming] = useState(false);

  const controls: FormDialogControls = {
    requestClose: () => {
      if (dirty.current) {
        setConfirming(true);
      } else {
        onOpenChange(false);
      }
    },
    setDirty: (next) => {
      dirty.current = next;
    },
  };

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
      <Shell {...props} onOpenChange={handleOpenChange} />
      <DiscardConfirm
        onDiscard={() => {
          setConfirming(false);
          dirty.current = false;
          onOpenChange(false);
        }}
        onKeep={() => {
          setConfirming(false);
        }}
        open={confirming}
      />
    </FormDialogContext>
  );
};
