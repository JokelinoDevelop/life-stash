import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ResponsiveDialog } from "@/components/app/responsive-dialog";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";

import { useInvalidateGarage } from "../cars/cars.queries";
import { skipFormDefaults, skipFormToRequest } from "./forms/skip-form/mapper";
import { SkipForm } from "./forms/skip-form/skip-form";

/** "Skip this time": records when it was skipped and schedules the next one. */
export const SkipReminderDialog = ({
  onOpenChange,
  open,
  reminderId,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  reminderId: string;
}) => {
  const { t } = useTranslation("garageReminders");
  const invalidate = useInvalidateGarage();
  const errorMessage = useErrorMessage();
  const { unit } = useFormat();

  return (
    <ResponsiveDialog
      description={t("skip.description")}
      onOpenChange={onOpenChange}
      open={open}
      title={t("skip.title")}
    >
      <SkipForm
        defaultValues={skipFormDefaults(todayIso())}
        onSubmit={async (values) => {
          try {
            await unwrap(
              api.garage.reminders[":reminderId"].skip.$post({
                json: skipFormToRequest(values, unit),
                param: { reminderId },
              })
            );
            await invalidate();
            toast.success(t("tab.skipped"));
            onOpenChange(false);
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
      />
    </ResponsiveDialog>
  );
};
