import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useAppForm } from "@/components/form/form-hook";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";

import { passwordSetupFormToRequest } from "./mapper";
import { passwordSetupFormDefaults, passwordSetupFormSchema } from "./schema";

/** First-run setup with email and password; hands the recovery codes back to the page. */
export const PasswordSetupForm = ({
  onCreated,
}: {
  onCreated: (codes: string[]) => void;
}) => {
  const { t } = useTranslation("auth");
  const errorMessage = useErrorMessage();

  const form = useAppForm({
    defaultValues: passwordSetupFormDefaults,
    onSubmit: async ({ value }) => {
      try {
        const { recoveryCodes } = await unwrap(
          api.auth.setup.password.$post({
            json: passwordSetupFormToRequest(value),
          })
        );

        onCreated(recoveryCodes);
      } catch (error) {
        toast.error(errorMessage(error));
      }
    },
    validators: { onSubmit: passwordSetupFormSchema },
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.AppField name="displayName">
        {(field) => (
          <field.TextField
            autoComplete="name"
            autoFocus
            label={t("setup.displayName")}
          />
        )}
      </form.AppField>
      <form.AppField name="email">
        {(field) => (
          <field.TextField
            autoComplete="email"
            inputMode="email"
            label={t("fields.email")}
            type="email"
          />
        )}
      </form.AppField>
      <form.AppField name="password">
        {(field) => (
          <field.TextField
            autoComplete="new-password"
            description={t("fields.passwordHint")}
            label={t("fields.password")}
            type="password"
          />
        )}
      </form.AppField>
      <form.AppField name="confirmPassword">
        {(field) => (
          <field.TextField
            autoComplete="new-password"
            label={t("fields.confirmPassword")}
            type="password"
          />
        )}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton label={t("setup.submitPassword")} />
      </form.AppForm>
    </form>
  );
};
