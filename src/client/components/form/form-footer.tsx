import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useFormDialog } from "@/components/app/form-dialog-context";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

import { useFormContext } from "./form-context";

/** Tells the surrounding dialog whether closing would lose changes. */
const ReportDirty = ({ dirty }: { dirty: boolean }) => {
  const dialog = useFormDialog();

  useEffect(() => {
    dialog?.setDirty(dirty);
  }, [dialog, dirty]);

  return null;
};

/**
 * The footer of a dialog form: a hint (or `start`, e.g. Delete) on the left,
 * Cancel and Save (⌘↵) on the right. Save keeps its width while saving.
 * Phones: one full-width Save (sheets close by swiping down, so no Cancel);
 * `start` and `secondary` sit beside it.
 */
export const FormFooter = ({
  onCancel,
  secondary,
  start,
  submitLabel,
}: {
  onCancel: () => void;
  /** A second action before Save, e.g. "Save as draft". */
  secondary?: ReactNode;
  start?: ReactNode;
  submitLabel?: string;
}) => {
  const form = useFormContext();
  const dialog = useFormDialog();
  const { t } = useTranslation();

  return (
    <div className="border-divider pb-safe-2.5 flex shrink-0 items-center gap-2 border-t px-3 pt-2.5 md:px-5 md:py-3">
      <div
        className={cn(
          "flex min-w-0 items-center md:flex-1",
          start === undefined && "hidden md:flex"
        )}
      >
        {start ?? (
          <span className="text-muted-foreground hidden items-center gap-1.5 text-xs md:flex">
            <Kbd>esc</Kbd>
            {t("form.escToCancel")}
          </span>
        )}
      </div>
      <form.Subscribe
        selector={(state) => state.isDirty && !state.isSubmitting}
      >
        {(dirty) => <ReportDirty dirty={dirty} />}
      </form.Subscribe>
      <Button
        onClick={() => {
          if (dialog === null) {
            onCancel();
          } else {
            dialog.requestClose();
          }
        }}
        className="hidden md:inline-flex"
        size="compact"
        type="button"
        variant="ghost"
      >
        {t("actions.cancel")}
      </Button>
      {secondary}
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button
            aria-busy={isSubmitting}
            disabled={isSubmitting}
            size="submit"
            type="submit"
          >
            {submitLabel ?? t("actions.save")}
            {isSubmitting ? (
              <Loader2 aria-hidden="true" className="animate-spin" />
            ) : (
              <Kbd className="hidden md:inline-flex">⌘↵</Kbd>
            )}
          </Button>
        )}
      </form.Subscribe>
    </div>
  );
};
