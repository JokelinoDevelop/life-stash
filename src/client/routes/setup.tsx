import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useAppForm } from "@/components/form/form-hook";
import { setupWithPasskey } from "@/lib/passkeys";
import { queryKeys } from "@/lib/query-keys";
import { authStatusQuery } from "@/lib/session";
import { AuthLayout } from "@/modules/auth/auth-layout";
import { RecoveryCodesPanel } from "@/modules/auth/recovery-codes-panel";
import {
  setupFormDefaults,
  setupFormSchema,
} from "@/modules/auth/setup-form/schema";
import { usePasskeyErrorMessage } from "@/modules/auth/use-passkey-error";

const SetupPage = () => {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const errorMessage = usePasskeyErrorMessage();
  const [codes, setCodes] = useState<string[] | null>(null);

  const form = useAppForm({
    defaultValues: setupFormDefaults,
    onSubmit: async ({ value }) => {
      try {
        setCodes(await setupWithPasskey(value.displayName.trim()));
      } catch (error) {
        toast.error(errorMessage(error));
      }
    },
    validators: { onSubmit: setupFormSchema },
  });

  return (
    <AuthLayout description={t("setup.description")} title={t("setup.title")}>
      {codes === null ? (
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
          <form.AppForm>
            <form.SubmitButton label={t("setup.submit")} />
          </form.AppForm>
        </form>
      ) : (
        <RecoveryCodesPanel
          codes={codes}
          onDone={async () => {
            await queryClient.invalidateQueries({
              queryKey: queryKeys.authStatus,
            });
            await navigate({ to: "/garage" });
          }}
        />
      )}
    </AuthLayout>
  );
};

export const Route = createFileRoute("/setup")({
  beforeLoad: async ({ context }) => {
    const status = await context.queryClient.query(authStatusQuery);

    if (!status.setupRequired) {
      throw redirect({ to: "/login" });
    }
  },
  component: SetupPage,
});
