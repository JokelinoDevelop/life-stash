import type { InvoiceStatus } from "@shared/domain/finances/invoices";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

/**
 * Status is a shape (design language): draft = dashed ring, sent = ring with a quarter, overdue =
 * solid "!" disc, paid = check disc, void = struck-through grey ring. Colour is the second cue.
 */
export const InvoiceStatusIcon = ({
  className,
  status,
}: {
  className?: string;
  status: InvoiceStatus;
}) => {
  const { t } = useTranslation("finances");
  const label = t(`invoices.status.${status}`);
  const base = cn("size-4 shrink-0", className);

  if (status === "overdue") {
    return (
      <svg
        aria-label={label}
        className={cn(base, "text-destructive")}
        role="img"
        viewBox="0 0 16 16"
      >
        <circle cx="8" cy="8" fill="currentColor" r="7" />
        <path
          d="M8 4.6v4.2M8 11.2v.1"
          stroke="var(--color-primary-foreground)"
          strokeLinecap="round"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  if (status === "paid") {
    return (
      <svg
        aria-label={label}
        className={cn(base, "text-success")}
        role="img"
        viewBox="0 0 16 16"
      >
        <circle cx="8" cy="8" fill="currentColor" r="7" />
        <path
          d="m5 8.2 2 2 4-4.2"
          fill="none"
          stroke="var(--color-primary-foreground)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  if (status === "sent") {
    return (
      <svg
        aria-label={label}
        className={cn(base, "text-primary")}
        role="img"
        viewBox="0 0 16 16"
      >
        <circle
          cx="8"
          cy="8"
          fill="none"
          r="6.25"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M8 3.5A4.5 4.5 0 0 1 12.5 8H8Z" fill="currentColor" />
      </svg>
    );
  }

  if (status === "void") {
    return (
      <svg
        aria-label={label}
        className={cn(base, "text-muted-foreground")}
        role="img"
        viewBox="0 0 16 16"
      >
        <circle
          cx="8"
          cy="8"
          fill="none"
          r="6.25"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M3.5 12.5 12.5 3.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <svg
      aria-label={label}
      className={cn(base, "text-muted-foreground")}
      role="img"
      viewBox="0 0 16 16"
    >
      <circle
        cx="8"
        cy="8"
        fill="none"
        r="6.25"
        stroke="currentColor"
        strokeDasharray="2.4 2.5"
        strokeWidth="1.5"
      />
    </svg>
  );
};
