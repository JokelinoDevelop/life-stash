import { useTranslation } from "react-i18next";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { LoadingState } from "./states";

/**
 * Stands in for `PageHeader` while a route loads, at the same heights: the
 * desktop bar, and on phones the top row, optional eyebrow, large title and
 * optional summary line.
 */
export const HeaderSkeleton = ({
  description = false,
  eyebrow = false,
}: {
  description?: boolean;
  eyebrow?: boolean;
}) => (
  <>
    <div className="border-divider bg-card hidden h-11 items-center rounded-t-lg border-b pl-5 md:flex">
      <Skeleton className="h-3.5 w-24" />
    </div>
    {/* Bars sit inside the real text styles, so each line is exactly as tall. */}
    <div className="mb-5 flex flex-col gap-2 md:hidden">
      <div className="flex min-h-11 items-center border-b border-transparent">
        <Skeleton className="h-5 w-36" />
      </div>
      <div>
        {eyebrow && (
          <p className="mb-0.5 text-xs">
            <Skeleton className="inline-block h-3 w-32 align-middle" />
          </p>
        )}
        <p className="text-2xl">
          <Skeleton className="inline-block h-6 w-28 align-middle" />
        </p>
        {description && (
          <p className="mt-0.5 text-sm">
            <Skeleton className="inline-block h-3.5 w-48 align-middle" />
          </p>
        )}
      </div>
      <div />
    </div>
  </>
);

/** Panel heights, matching the loaded panels on phones and desktop. */
const PANEL_HEIGHT = {
  /** Garage "Spent in …" with its month bars. */
  chart: "h-50 md:h-56",
  /** Finances "Net in …" with in/out bars. */
  cashflow: "h-61 md:h-64",
  /** Fitness stat grid (2×2 on phones, one row on desktop). */
  stats: "h-46 md:h-24",
  /** Fitness month calendar. */
  calendar: "h-102 md:h-[36rem]",
} as const;

export type PanelKind = keyof typeof PANEL_HEIGHT;

/** A card-shaped block: inset on phones, a full-width band on desktop (like `StatPanel`). */
export const PanelSkeleton = ({ kind }: { kind: PanelKind }) => (
  <div
    className={cn(
      "surface bg-card md:border-divider flex flex-col gap-3 overflow-hidden rounded-lg border p-4 md:rounded-none md:border-0 md:border-b md:px-5",
      PANEL_HEIGHT[kind]
    )}
  >
    <Skeleton className="h-3 w-24" />
    <Skeleton className="h-7 w-40" />
    <Skeleton className="mt-auto h-1/2 w-full" />
  </div>
);

/** The finances quick actions (Expense, Income, Invoice) on phones. */
export const ChipRowSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="flex gap-2 md:hidden">
    {Array.from({ length: count }, (_chip, chip) => (
      <Skeleton className="h-10 w-24" key={`chip-${chip}`} />
    ))}
  </div>
);

const NO_PANELS: PanelKind[] = [];

/**
 * A page's body while it loads: its panels, then list sections. Shaped like
 * the loaded page, so nothing jumps when the content arrives.
 */
export const BodySkeleton = ({
  chips = false,
  panels = NO_PANELS,
  rows = 4,
  sections = 2,
}: {
  chips?: boolean;
  panels?: PanelKind[];
  rows?: number;
  sections?: number;
}) => {
  const { t } = useTranslation();

  return (
    <output
      aria-busy="true"
      aria-label={t("loading")}
      className="animate-reveal flex flex-col gap-6 md:gap-0"
    >
      {panels.map((kind) => (
        <PanelSkeleton key={kind} kind={kind} />
      ))}
      {chips && <ChipRowSkeleton />}
      {sections > 0 && <LoadingState rows={rows} sections={sections} />}
    </output>
  );
};

/** A whole page while its route loads: header and body. */
export const PageSkeleton = ({
  description = true,
  eyebrow = false,
  ...body
}: Parameters<typeof BodySkeleton>[0] & {
  description?: boolean;
  eyebrow?: boolean;
}) => (
  <>
    <HeaderSkeleton description={description} eyebrow={eyebrow} />
    <BodySkeleton {...body} />
  </>
);

/** A Settings tab while it loads: groups of rows in the centred column (the tabs stay put). */
export const SettingsSkeleton = () => <BodySkeleton rows={4} sections={3} />;
