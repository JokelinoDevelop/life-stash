import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useAppForm } from "@/components/form/form-hook";
import { api, ApiClientError, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";

import { reauthFormToRequest } from "./mapper";
import { reauthFormDefaults, reauthFormSchema } from "./schema";

/** Your current password, to confirm it's you before a sensitive change. */
export const ReauthForm = ({
  email,
  onConfirmed,
}: {
  email: string;
  onConfirmed: () => Promise<void>;
}) => {
  const { t } = useTranslation("settings");
  const { t: ta } = useTranslation("auth");
  const errorMessage = useErrorMessage();

  const form = useAppForm({
    defaultValues: reauthFormDefaults,
    onSubmit: async ({ value }) => {
      try {
        await unwrap(
          api.auth.login.password.$post({
            json: reauthFormToRequest(value, email),
          })
        );
      } catch (error) {
        toast.error(
          error instanceof ApiClientError && error.code === "unauthorized"
            ? t("security.reauthWrongPassword")
            : errorMessage(error)
        );

        return;
      }

      await onConfirmed();
    },
    validators: { onSubmit: reauthFormSchema },
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.AppField name="password">
        {(field) => (
          <field.TextField
            autoComplete="current-password"
            autoFocus
            label={ta("fields.password")}
            type="password"
          />
        )}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton label={t("security.reauthConfirm")} />
      </form.AppForm>
    </form>
  );
};
