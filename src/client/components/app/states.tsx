import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useErrorMessage } from "@/lib/errors";

export const LoadingState = ({ rows = 3 }: { rows?: number }) => (
  <div aria-busy="true" className="flex flex-col gap-3">
    {Array.from({ length: rows }, (_, index) => (
      <Skeleton className="h-20 w-full" key={index} />
    ))}
  </div>
);

export const ErrorState = ({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) => {
  const { t } = useTranslation();
  const message = useErrorMessage();

  return (
    <div className="border-destructive/30 bg-destructive/5 flex flex-col items-start gap-3 rounded-xl border p-4">
      <p className="text-sm">{message(error)}</p>
      {onRetry !== undefined && (
        <Button onClick={onRetry} size="sm" variant="outline">
          {t("actions.retry")}
        </Button>
      )}
    </div>
  );
};

export const EmptyState = ({
  icon,
  message,
  action,
}: {
  icon?: ReactNode;
  message: ReactNode;
  action?: ReactNode;
}) => (
  <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
    {icon !== undefined && <div className="text-muted-foreground">{icon}</div>}
    <p className="text-muted-foreground max-w-sm text-sm">{message}</p>
    {action}
  </div>
);
