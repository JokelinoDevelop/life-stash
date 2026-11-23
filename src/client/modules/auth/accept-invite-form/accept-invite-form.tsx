import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useIsDesktop } from "@/components/app/responsive-dialog";
import { useAppForm } from "@/components/form/form-hook";
import { api, ApiClientError, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";

import { acceptInviteFormDefaults, acceptInviteFormToRequest } from "./mapper";
import { acceptInviteFormSchema } from "./schema";

/** Creates the invited account; the household was decided by whoever sent the invite. */
export const AcceptInviteForm = ({
  name,
  onCreated,
  token,
}: {
  name: string | null;
  token: string;
  onCreated: (codes: string[]) => void;
}) => {
  const { t } = useTranslation("auth");
  // Phones: no keyboard over the screen before the user taps a field.
  const isDesktop = useIsDesktop();
  const errorMessage = useErrorMessage();

  const form = useAppForm({
    defaultValues: acceptInviteFormDefaults(name),
    onSubmit: async ({ value, formApi }) => {
      try {
        const { recoveryCodes } = await unwrap(
          api.auth.invites[":token"].accept.$post({
            json: acceptInviteFormToRequest(value),
            param: { token },
          })
        );

        onCreated(recoveryCodes);
      } catch (error) {
        if (error instanceof ApiClientError && error.field === "email") {
          formApi.setFieldMeta("email", (meta) => ({
            ...meta,
            errorMap: { ...meta.errorMap, onSubmit: errorMessage(error) },
            isTouched: true,
          }));

          return;
        }

        toast.error(errorMessage(error));
      }
    },
    validators: { onSubmit: acceptInviteFormSchema },
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
            autoFocus={isDesktop && name === null}
            label={t("setup.displayName")}
          />
        )}
      </form.AppField>
      <form.AppField name="email">
        {(field) => (
          <field.TextField
            autoComplete="email"
            autoFocus={isDesktop && name !== null}
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
        <form.SubmitButton label={t("invite.submit")} size="block" />
      </form.AppForm>
    </form>
  );
};
