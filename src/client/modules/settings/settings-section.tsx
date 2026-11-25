import { ChevronRight } from "lucide-react";
import type * as React from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * One settings group: a small heading (and optional help line) above an
 * inset box. Rows inside are split by hairlines. One centred column on every
 * screen size, like iOS / Linear settings.
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
  <section className="flex flex-col gap-2">
    <div className="flex flex-col gap-0.5 px-0.5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description !== undefined && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
    </div>
    <div
      className={cn(
        "surface bg-card rounded-lg border",
        flush ? "divide-divider divide-y overflow-hidden" : "p-4"
      )}
    >
      {children}
    </div>
  </section>
);

/** The label (and optional help) on the left of a row. */
const RowText = ({
  description,
  htmlFor,
  label,
}: {
  description?: React.ReactNode;
  htmlFor?: string;
  label: React.ReactNode;
}) => (
  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
    {htmlFor === undefined ? (
      <span className="text-sm font-medium">{label}</span>
    ) : (
      <label className="text-sm font-medium" htmlFor={htmlFor}>
        {label}
      </label>
    )}
    {description !== undefined && (
      <span className="text-muted-foreground text-xs">{description}</span>
    )}
  </div>
);

const ROW = "flex min-h-13 items-center gap-3 px-4 py-2 md:min-h-12";

/** A row with its control on the right (select, switch, segmented control, input). */
export const SettingsRow = ({
  children,
  description,
  htmlFor,
  label,
}: {
  children?: React.ReactNode;
  description?: React.ReactNode;
  /** The control's id, so the label focuses it. */
  htmlFor?: string;
  label: React.ReactNode;
}) => (
  <div className={ROW}>
    <RowText description={description} htmlFor={htmlFor} label={label} />
    {children !== undefined && children !== null && (
      <div className="flex shrink-0 items-center">{children}</div>
    )}
  </div>
);

/**
 * A row that opens something (a sheet, a download): its value on the right in
 * muted text and a chevron. `render` swaps the button for a link.
 */
export const SettingsActionRow = ({
  description,
  icon,
  label,
  onClick,
  render,
  tone = "default",
  trailing,
  value,
}: {
  description?: React.ReactNode;
  icon?: React.ReactNode;
  label: React.ReactNode;
  onClick?: () => void;
  /** e.g. an `<a download>`; its children are replaced by the row's content. */
  render?: (content: React.ReactNode, className: string) => React.ReactElement;
  /** `warning`: the value needs attention (e.g. few recovery codes left). */
  tone?: "default" | "warning";
  /** Replaces the chevron (e.g. a download icon); null shows nothing. */
  trailing?: React.ReactNode;
  value?: React.ReactNode;
}) => {
  const className = cn(
    ROW,
    "hover:bg-background active:bg-accent w-full text-left transition-colors [&_svg]:shrink-0"
  );

  const content = (
    <>
      {icon !== undefined && (
        <span className="text-muted-foreground [&_svg]:size-4">{icon}</span>
      )}
      <RowText description={description} label={label} />
      {value !== undefined && (
        <span
          className={cn(
            "max-w-[45%] truncate text-sm tabular-nums",
            tone === "warning"
              ? "text-warning-foreground"
              : "text-muted-foreground"
          )}
        >
          {value}
        </span>
      )}
      {trailing === undefined ? (
        <ChevronRight
          aria-hidden="true"
          className="text-muted-foreground/60 size-4"
        />
      ) : (
        trailing
      )}
    </>
  );

  if (render !== undefined) {
    return render(content, className);
  }

  return (
    <button className={className} onClick={onClick} type="button">
      {content}
    </button>
  );
};

/** Stands in for a row's value while its data loads, so the row keeps its size. */
export const RowValueSkeleton = () => <Skeleton className="h-3.5 w-16" />;
