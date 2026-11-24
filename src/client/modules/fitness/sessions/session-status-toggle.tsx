import { useTranslation } from "react-i18next";

import { FieldLabel } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { SESSION_FORM_STATUSES } from "./forms/session-form/schema";

type FormStatus = (typeof SESSION_FORM_STATUSES)[number];

const isStatus = (value: string | undefined): value is FormStatus =>
  SESSION_FORM_STATUSES.some((status) => status === value);

/** Planned / Done / Skipped as one segmented control. */
export const SessionStatusToggle = ({
  onChange,
  value,
}: {
  onChange: (status: FormStatus) => void;
  value: FormStatus;
}) => {
  const { t } = useTranslation("fitness");

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel>{t("sessions.form.status")}</FieldLabel>
      <ToggleGroup
        aria-label={t("sessions.form.status")}
        onValueChange={([next]) => {
          if (isStatus(next)) {
            onChange(next);
          }
        }}
        size="segmented"
        spacing={0.5}
        value={[value]}
        variant="segmented"
      >
        {SESSION_FORM_STATUSES.map((status) => (
          <ToggleGroupItem key={status} value={status}>
            {t(`status.${status}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};
