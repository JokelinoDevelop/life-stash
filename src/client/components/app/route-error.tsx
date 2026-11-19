import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/lib/errors";

/** Shown in place of a page whose loader or render failed, with a retry. */
export const RouteError = ({ error, reset }: ErrorComponentProps) => {
  const { t } = useTranslation();
  const message = useErrorMessage();
  const router = useRouter();
  const queryReset = useQueryErrorResetBoundary();

  return (
    <div
      className="flex flex-col items-center gap-3 px-6 py-16 text-center"
      role="alert"
    >
      <div className="bg-card text-destructive flex size-10 items-center justify-center rounded-lg border [&_svg]:size-5">
        <AlertCircle />
      </div>
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-sm font-medium">{t("errors.pageFailed")}</p>
        <p className="text-muted-foreground text-sm">{message(error)}</p>
      </div>
      <Button
        className="mt-1"
        onClick={async () => {
          queryReset.reset();
          reset();
          await router.invalidate();
        }}
        size="compact"
        variant="outline"
      >
        {t("actions.retry")}
      </Button>
    </div>
  );
};
