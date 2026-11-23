import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useAppForm } from "@/components/form/form-hook";
import { Button } from "@/components/ui/button";
import { api, ApiClientError, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import { AuthLayout } from "@/modules/auth/auth-layout";
import {
  recoverFormDefaults,
  recoverFormSchema,
} from "@/modules/auth/recover-form/schema";

const RecoverPage = () => {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();

  const form = useAppForm({
    defaultValues: recoverFormDefaults,
    onSubmit: async ({ value }) => {
      try {
        const result = await unwrap(
          api.auth.recover.$post({ json: { code: value.code.trim() } })
        );

        toast.success(t("recover.success"), {
          description: t("recover.remaining", { count: result.remainingCodes }),
          duration: 10_000,
        });
        await queryClient.invalidateQueries({ queryKey: queryKeys.authStatus });
        await navigate({ to: "/settings" });
      } catch (error) {
        toast.error(
          error instanceof ApiClientError && error.code === "unauthorized"
            ? t("errors.invalidCode")
            : errorMessage(error)
        );
      }
    },
    validators: { onSubmit: recoverFormSchema },
  });

  return (
    <AuthLayout
      description={t("recover.description")}
      title={t("recover.title")}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.AppField name="code">
          {(field) => (
            <field.TextField
              autoComplete="one-time-code"
              autoFocus
              label={t("recover.code")}
              placeholder="XXXX-XXXX-XXXX"
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton label={t("recover.submit")} size="block" />
        </form.AppForm>
        <Button
          variant="link"
          render={<Link to="/login" />}
          nativeButton={false}
        >
          {t("recover.back")}
        </Button>
      </form>
    </AuthLayout>
  );
};

export const Route = createFileRoute("/recover")({ component: RecoverPage });
