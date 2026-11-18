import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useAppForm } from "@/components/form/form-hook";
import { setupWithPasskey } from "@/lib/passkeys";

import { setupFormDefaults, setupFormSchema } from "./setup-form/schema";
import { usePasskeyErrorMessage } from "./use-passkey-error";

/** First-run setup with a passkey; hands the recovery codes back to the page. */
export const PasskeySetupForm = ({
  onCreated,
}: {
  onCreated: (codes: string[]) => void;
}) => {
  const { t } = useTranslation("auth");
  const errorMessage = usePasskeyErrorMessage();

  const form = useAppForm({
    defaultValues: setupFormDefaults,
    onSubmit: async ({ value }) => {
      try {
        onCreated(await setupWithPasskey(value.displayName.trim()));
      } catch (error) {
        toast.error(errorMessage(error));
      }
    },
    validators: { onSubmit: setupFormSchema },
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
          <field.TextField autoComplete="name" label={t("setup.displayName")} />
        )}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton label={t("setup.submit")} />
      </form.AppForm>
    </form>
  );
};
