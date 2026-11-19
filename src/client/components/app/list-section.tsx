import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

/** Heading that sits above a hairline box: title, optional count and action. */
export const SectionHeading = ({
  action,
  count,
  title,
}: {
  action?: React.ReactNode;
  count?: number;
  title: React.ReactNode;
}) => (
  <div className="flex items-baseline justify-between gap-3 px-0.5">
    <h2 className="text-subtle-foreground text-sm font-semibold">
      {title}
      {count !== undefined && (
        <span className="text-muted-foreground ml-1.5 font-normal tabular-nums">
          {count}
        </span>
      )}
    </h2>
    {action}
  </div>
);

/**
 * A titled group of rows: heading outside, rows inside one hairline box.
 * Rows are 56px on touch and 40px on desktop (design language v0.3).
 */
export const ListSection = ({
  action,
  children,
  className,
  count,
  title,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  count?: number;
  title: React.ReactNode;
}) => (
  <section className={cn("flex flex-col gap-2", className)}>
    <SectionHeading action={action} count={count} title={title} />
    <ul className="bg-card divide-divider divide-y overflow-hidden rounded-lg border">
      {children}
    </ul>
  </section>
);

/** A titled hairline box for non-list content such as charts and tables. */
export const Panel = ({
  action,
  children,
  className,
  title,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
}) => (
  <section className="flex flex-col gap-2">
    {title !== undefined && <SectionHeading action={action} title={title} />}
    <div
      className={cn("bg-card overflow-hidden rounded-lg border p-4", className)}
    >
      {children}
    </div>
  </section>
);

/** One row. Use `asChild` to render a link (keep the `<li>` around it). */
export const ListRow = ({
  asChild = false,
  className,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) => {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <li>
      <Comp
        className={cn(
          "hover:bg-background flex min-h-14 items-center gap-3 px-3.5 transition-colors md:min-h-10 md:px-4",
          className
        )}
        data-slot="list-row"
        {...props}
      />
    </li>
  );
};

export const ListRowText = ({
  meta,
  title,
}: {
  meta?: React.ReactNode;
  title: React.ReactNode;
}) => (
  <div className="flex min-w-0 flex-1 flex-col md:flex-row md:items-baseline md:gap-2">
    <span className="truncate font-medium">{title}</span>
    {meta !== undefined && meta !== null && (
      <span className="text-muted-foreground truncate text-xs md:text-sm">
        {meta}
      </span>
    )}
  </div>
);
