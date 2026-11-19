import type * as React from "react";

import { cn } from "@/lib/utils";

/** Figures side by side in one hairline panel (2 columns on phones, 4 on desktop). */
export const StatPanel = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    className={cn(
      "bg-divider grid grid-cols-2 gap-px overflow-hidden rounded-lg border md:grid-cols-4",
      className
    )}
  >
    {children}
  </section>
);

export const Stat = ({
  hint,
  label,
  value,
}: {
  hint?: React.ReactNode;
  label: React.ReactNode;
  value: React.ReactNode;
}) => (
  <div className="bg-card flex min-w-0 flex-col gap-0.5 px-4 py-3">
    <span className="text-muted-foreground truncate text-xs font-medium md:text-sm">
      {label}
    </span>
    <span className="truncate text-lg font-semibold tracking-tight tabular-nums">
      {value}
    </span>
    {hint !== undefined && (
      <span className="text-muted-foreground truncate text-xs">{hint}</span>
    )}
  </div>
);
