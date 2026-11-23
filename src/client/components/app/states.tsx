import { AlertCircle, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

/** Bar widths for placeholder rows, so a list skeleton doesn't look like a barcode. */
const TITLE_WIDTHS = ["w-40", "w-28", "w-52", "w-36", "w-44", "w-32"] as const;
const META_WIDTHS = ["w-24", "w-32", "w-20", "w-28", "w-16", "w-24"] as const;

const SkeletonRow = ({ index }: { index: number }) => (
  <li className="flex min-h-14 items-center gap-3 px-3.5 md:min-h-10 md:px-5">
    <Skeleton className="size-5 shrink-0" variant="circle" />
    <div className="flex min-w-0 flex-1 flex-col gap-1.5 md:flex-row md:items-center md:gap-3">
      <div className={TITLE_WIDTHS[index % TITLE_WIDTHS.length]}>
        <Skeleton className="h-3.5 w-full" />
      </div>
      <div className={META_WIDTHS[index % META_WIDTHS.length]}>
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
    <Skeleton className="hidden h-3 w-14 md:block" />
  </li>
);

/**
 * Loading placeholder that waits 150 ms before fading in, so cached or fast
 * loads never flash. `list`: shaped like a `ListSection` (heading band and
 * rows). `rows`: rows only, for inside a box. `block`: one block, for charts.
 */
export const LoadingState = ({
  rows = 3,
  sections = 1,
  variant = "list",
}: {
  rows?: number;
  sections?: number;
  variant?: "list" | "rows" | "block";
}) => {
  const { t } = useTranslation();

  if (variant === "block") {
    return (
      <output
        aria-busy="true"
        aria-label={t("loading")}
        className="animate-reveal block"
      >
        <Skeleton className="h-48 w-full" />
      </output>
    );
  }

  if (variant === "rows") {
    return (
      <output
        aria-busy="true"
        aria-label={t("loading")}
        className="animate-reveal block"
      >
        <ul className="divide-divider divide-y [&>li]:px-0">
          {Array.from({ length: rows }, (_row, row) => (
            <SkeletonRow index={row} key={row} />
          ))}
        </ul>
      </output>
    );
  }

  return (
    <output
      aria-busy="true"
      aria-label={t("loading")}
      className="animate-reveal flex flex-col gap-6 md:gap-0"
    >
      {Array.from({ length: sections }, (_section, section) => (
        <div className="flex flex-col gap-2 md:gap-0" key={section}>
          <div className="md:bg-background md:border-divider flex h-5 items-center px-0.5 md:h-8 md:border-b md:px-5">
            <Skeleton className="h-3 w-24" />
          </div>
          <ul className="bg-card divide-divider md:border-divider divide-y overflow-hidden rounded-lg border md:rounded-none md:border-0 md:border-b">
            {Array.from({ length: rows }, (_row, row) => (
              <SkeletonRow index={row + section} key={row} />
            ))}
          </ul>
        </div>
      ))}
    </output>
  );
};

/** Placeholder for a dialog form while the entry it edits loads. */
export const FormSkeleton = ({ fields = 4 }: { fields?: number }) => {
  const { t } = useTranslation();

  return (
    <output
      aria-busy="true"
      aria-label={t("loading")}
      className="animate-reveal flex flex-col gap-4 px-4 py-4"
    >
      {Array.from({ length: fields }, (_field, index) => (
        <div className="flex flex-col gap-2" key={index}>
          <div className={META_WIDTHS[index % META_WIDTHS.length]}>
            <Skeleton className="h-3 w-full" />
          </div>
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </output>
  );
};

/** A small inline spinner for background work (e.g. refetching); hidden from layout flow. */
export const InlineSpinner = ({ className }: { className?: string }) => {
  const { t } = useTranslation();

  return (
    <output aria-label={t("loading")} className={cn("inline-flex", className)}>
      <Loader2
        aria-hidden="true"
        className="text-muted-foreground size-3.5 animate-spin"
      />
    </output>
  );
};

/** Something failed to load: what happened and a retry, in place of the content. */
export const ErrorState = ({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) => {
  const { t } = useTranslation();
  const message = useErrorMessage();

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 md:mx-5 md:my-4",
        className
      )}
      role="alert"
    >
      <AlertCircle className="text-destructive mt-0.5 size-4 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm font-medium">{t("errors.loadFailed")}</p>
        <p className="text-muted-foreground text-sm">{message(error)}</p>
      </div>
      {onRetry !== undefined && (
        <Button onClick={onRetry} size="compact" variant="outline">
          {t("actions.retry")}
        </Button>
      )}
    </div>
  );
};

/** Nothing here yet: a neutral icon, a title, one line of help and the main action. */
export const EmptyState = ({
  action,
  icon,
  message,
  title,
}: {
  action?: ReactNode;
  icon?: ReactNode;
  message: ReactNode;
  title?: ReactNode;
}) => (
  <div className="animate-fade flex flex-col items-center gap-3 px-6 py-12 text-center">
    {icon !== undefined && (
      <div className="bg-card text-muted-foreground flex size-10 items-center justify-center rounded-lg border [&_svg]:size-5">
        {icon}
      </div>
    )}
    <div className="flex max-w-sm flex-col gap-1">
      {title !== undefined && <p className="text-sm font-medium">{title}</p>}
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
    {action !== undefined && action !== null && (
      <div className="mt-1">{action}</div>
    )}
  </div>
);
