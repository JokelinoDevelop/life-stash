import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useAppForm } from "@/components/form/form-hook";
import { FieldGroup } from "@/components/ui/field";
import { api, unwrap } from "@/lib/api";
import type { SuccessBody } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";

import { credentialsFormToRequest, credentialsToFormValues } from "./mapper";
import { credentialsFormSchema } from "./schema";

type Credentials = SuccessBody<
  Awaited<ReturnType<typeof api.account.credentials.$get>>
>;

export const CredentialsForm = ({
  credentials,
}: {
  credentials: Credentials;
}) => {
  const { t } = useTranslation("settings");
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();
  const askCurrent = credentials.hasPassword && !credentials.recentlySignedIn;

  const form = useAppForm({
    defaultValues: credentialsToFormValues(credentials),
    onSubmit: async ({ value, formApi }) => {
      try {
        await unwrap(
          api.account.credentials.$put({
            json: credentialsFormToRequest(value),
          })
        );
      } catch (error) {
        toast.error(errorMessage(error));

        return;
      }

      toast.success(t("security.credentialsSaved"));
      formApi.reset({
        ...value,
        confirmPassword: "",
        currentPassword: "",
        newPassword: "",
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.credentials });
    },
    validators: { onSubmit: credentialsFormSchema(!credentials.hasPassword) },
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.AppField name="email">
          {(field) => (
            <field.TextField
              autoComplete="username"
              inputMode="email"
              label={t("security.email")}
              type="email"
            />
          )}
        </form.AppField>
        {askCurrent && (
          <form.AppField name="currentPassword">
            {(field) => (
              <field.TextField
                autoComplete="current-password"
                label={t("security.currentPassword")}
                type="password"
              />
            )}
          </form.AppField>
        )}
        <form.AppField name="newPassword">
          {(field) => (
            <field.TextField
              autoComplete="new-password"
              label={
                credentials.hasPassword
                  ? t("security.newPasswordKeep")
                  : t("security.newPassword")
              }
              type="password"
            />
          )}
        </form.AppField>
        <form.AppField name="confirmPassword">
          {(field) => (
            <field.TextField
              autoComplete="new-password"
              label={t("security.confirmPassword")}
              type="password"
            />
          )}
        </form.AppField>
      </FieldGroup>
      <form.AppForm>
        <form.SubmitButton
          className="self-start"
          label={t("security.saveCredentials")}
        />
      </form.AppForm>
    </form>
  );
};
