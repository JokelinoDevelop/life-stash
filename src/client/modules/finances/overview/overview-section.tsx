import type { ReactNode } from "react";

import { useListMotion } from "@/lib/motion";

/** A titled list band on the overview (count, link on the right), rows as children. */
export const OverviewSection = ({
  action,
  children,
  count,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  count?: number;
  title: ReactNode;
}) => {
  const rows = useListMotion();

  return (
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
      <ul
        className="bg-card divide-divider md:border-divider divide-y overflow-hidden rounded-lg border md:rounded-none md:border-0"
        ref={rows}
      >
        {children}
      </ul>
    </section>
  );
};
