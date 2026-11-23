import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useAppForm } from "@/components/form/form-hook";
import { api, ApiClientError, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";

import { passwordLoginFormToRequest } from "./mapper";
import { passwordLoginFormDefaults, passwordLoginFormSchema } from "./schema";

export const PasswordLoginForm = ({
  onSignedIn,
}: {
  onSignedIn: () => Promise<void>;
}) => {
  const { t } = useTranslation("auth");
  const errorMessage = useErrorMessage();

  const form = useAppForm({
    defaultValues: passwordLoginFormDefaults,
    onSubmit: async ({ value }) => {
      try {
        await unwrap(
          api.auth.login.password.$post({
            json: passwordLoginFormToRequest(value),
          })
        );
      } catch (error) {
        toast.error(
          error instanceof ApiClientError && error.code === "unauthorized"
            ? t("errors.invalidLogin")
            : errorMessage(error)
        );

        return;
      }

      await onSignedIn();
    },
    validators: { onSubmit: passwordLoginFormSchema },
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.AppField name="email">
        {(field) => (
          <field.TextField
            autoComplete="username"
            autoFocus
            inputMode="email"
            label={t("fields.email")}
            type="email"
          />
        )}
      </form.AppField>
      <form.AppField name="password">
        {(field) => (
          <field.TextField
            autoComplete="current-password"
            label={t("fields.password")}
            type="password"
          />
        )}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton label={t("login.submitPassword")} size="block" />
      </form.AppForm>
    </form>
  );
};
