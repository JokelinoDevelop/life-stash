import type { ReactNode } from "react";

import { ListRows } from "@/components/app/list-section";

/** A titled list band on the overview (count, link on the right), rows as children. */
export const OverviewSection = ({
  action,
  animated = false,
  children,
  count,
  title,
}: {
  action?: ReactNode;
  /** Rows fade in and out (short lists the user acts on, like "To confirm"). */
  animated?: boolean;
  children: ReactNode;
  count?: number;
  title: ReactNode;
}) => (
  <section className="flex flex-col gap-2 md:gap-0" data-bleed="">
    <div className="md:bg-background md:border-divider flex items-baseline gap-2 px-0.5 text-sm md:h-8 md:items-center md:border-t md:border-b md:px-5 md:text-xs">
      <h2 className="text-subtle-foreground font-semibold md:font-medium">
        {title}
      </h2>
      {count !== undefined && (
        <span className="text-muted-foreground tabular-nums">{count}</span>
      )}
      {action !== undefined && <span className="ml-auto">{action}</span>}
    </div>
    <ListRows animated={animated} className="md:border-b-0">
      {children}
    </ListRows>
  </section>
);
