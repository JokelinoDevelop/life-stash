import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * One settings group: title and description on the left on desktop,
 * the controls in a hairline box on the right (stacked on phones).
 */
export const SettingsSection = ({
  children,
  description,
  flush = false,
  title,
}: {
  children: React.ReactNode;
  description?: React.ReactNode;
  /** The box holds rows edge to edge (a list) instead of padded controls. */
  flush?: boolean;
  title: React.ReactNode;
}) => (
  <section className="border-divider grid grid-cols-1 gap-3 border-b pb-6 last:border-0 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-8">
    <div className="flex flex-col gap-1">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description !== undefined && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
    </div>
    <div
      className={cn(
        "surface bg-card rounded-lg border",
        flush ? "overflow-hidden" : "p-4"
      )}
    >
      {children}
    </div>
  </section>
);
