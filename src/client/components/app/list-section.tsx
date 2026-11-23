import { useRender } from "@base-ui/react/use-render";
import type * as React from "react";

import { useListMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { SwipeActions } from "./swipe-actions";
import type { SwipeAction } from "./swipe-actions";

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
 * A titled group of rows. Phones: heading outside, rows in one hairline box.
 * Desktop: a grey band heading with full-bleed rows (add `data-bleed` so a
 * `PageStack` does not pad it). Rows are 52px on touch and 40px on desktop.
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
  <section
    className={cn("flex flex-col gap-2 md:gap-0", className)}
    data-bleed=""
  >
    <div className="md:bg-background md:border-divider md:flex md:h-8 md:items-center md:border-b md:px-5 md:[&_h2]:text-xs md:[&_h2]:font-medium">
      <div className="w-full">
        <SectionHeading action={action} count={count} title={title} />
      </div>
    </div>
    <ListRows>{children}</ListRows>
  </section>
);

const ROWS_BOX =
  "surface bg-card divide-divider md:border-divider divide-y overflow-hidden rounded-lg border md:rounded-none md:border-0 md:border-b";

/**
 * The rows box of a `ListSection`, for lists that draw their own heading.
 * Static by default; `animated` for short lists the user edits in place
 * (rows fade in and out). Data lists that refetch or filter stay still.
 */
export const ListRows = ({
  animated = false,
  children,
  className,
}: {
  animated?: boolean;
  children: React.ReactNode;
  className?: string;
}) =>
  animated ? (
    <MotionList className={cn(ROWS_BOX, className)}>{children}</MotionList>
  ) : (
    <ul className={cn(ROWS_BOX, className)}>{children}</ul>
  );

/** A plain `<ul>` whose rows animate in and out; for lists rendered inside render props. */
export const MotionList = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const rows = useListMotion();

  return (
    <ul className={className} ref={rows}>
      {children}
    </ul>
  );
};

/** A hairline box for non-list content (charts, tables, form fields), optionally titled. */
export const Panel = ({
  action,
  children,
  className,
  description,
  title,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  description?: React.ReactNode;
  title?: React.ReactNode;
}) => (
  <section className="flex flex-col gap-2">
    {title !== undefined && (
      <div className="flex flex-col gap-0.5">
        <SectionHeading action={action} title={title} />
        {description !== undefined && (
          <p className="text-muted-foreground px-0.5 text-sm">{description}</p>
        )}
      </div>
    )}
    <div
      className={cn(
        "surface bg-card overflow-hidden rounded-lg border p-4",
        className
      )}
    >
      {children}
    </div>
  </section>
);

/**
 * One row. Pass `render` to make it a link (the `<li>` stays around it), and
 * `swipe` for phone swipe actions (the tap path keeps working).
 */
export const ListRow = ({
  after,
  className,
  render,
  swipe,
  ...props
}: useRender.ComponentProps<"div"> & {
  /** Rendered beside the row, outside its link (e.g. a dialog it opens). */
  after?: React.ReactNode;
  swipe?: readonly SwipeAction[];
}) => {
  const element = useRender({
    defaultTagName: "div",
    props: {
      className: cn(
        "group/row hover:bg-background [&:is(a,button)]:active:bg-accent flex min-h-13 items-center gap-3 px-3.5 transition-colors md:min-h-10 md:px-5",
        className
      ),
      "data-slot": "list-row",
      ...props,
    },
    render,
  });

  return (
    <li>
      {swipe === undefined ? (
        element
      ) : (
        <SwipeActions actions={swipe}>{element}</SwipeActions>
      )}
      {after}
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
