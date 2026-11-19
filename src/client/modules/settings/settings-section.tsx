import type * as React from "react";

/**
 * One settings group: title and description on the left on desktop,
 * the controls in a hairline box on the right (stacked on phones).
 */
export const SettingsSection = ({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description?: React.ReactNode;
  title: React.ReactNode;
}) => (
  <section className="border-divider grid gap-3 border-b pb-6 last:border-0 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-8">
    <div className="flex flex-col gap-1">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description !== undefined && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
    </div>
    <div className="bg-card rounded-lg border p-4">{children}</div>
  </section>
);
