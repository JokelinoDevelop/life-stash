import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useFormDialog } from "@/components/app/form-dialog-context";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";

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
 */
export const FormFooter = ({
  onCancel,
  start,
  submitLabel,
}: {
  onCancel: () => void;
  start?: ReactNode;
  submitLabel?: string;
}) => {
  const form = useFormContext();
  const dialog = useFormDialog();
  const { t } = useTranslation();

  return (
    <div className="border-divider pb-safe flex shrink-0 items-center gap-2 border-t px-3 py-2.5">
      <div className="flex min-w-0 flex-1 items-center">
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
        size="compact"
        type="button"
        variant="ghost"
      >
        {t("actions.cancel")}
      </Button>
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button
            aria-busy={isSubmitting}
            disabled={isSubmitting}
            size="compact"
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
