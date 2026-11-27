import { Link } from "@tanstack/react-router";
import type { LinkProps } from "@tanstack/react-router";
import { CarFront, Dumbbell, Sun, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { lazy, Suspense, useRef } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { useTodayCount } from "@/modules/today/today-view";

import { CommandMenuProvider } from "./command-menu";
import { DoneTickHost } from "./done-tick";
import { PageOutlet } from "./page-outlet";
import { QuickAdd } from "./quick-add";
import { RouteProgress } from "./route-progress";
import { Sidebar } from "./sidebar";
import { useSwipeBack } from "./use-swipe-back";

/* The dialog hosts carry every create/edit form; they load right after the
   shell paints instead of on the critical path (a dialog link opened before
   they arrive simply shows once they do). */
const EntryDialogHost = lazy(async () => {
  const module =
    await import("@/modules/garage/entry-dialogs/entry-dialog-host");

  return { default: module.EntryDialogHost };
});

const FinanceDialogHost = lazy(async () => {
  const module = await import("@/modules/finances/dialogs/finance-dialog-host");

  return { default: module.FinanceDialogHost };
});

const FitnessDialogHost = lazy(async () => {
  const module = await import("@/modules/fitness/dialogs/fitness-dialog-host");

  return { default: module.FitnessDialogHost };
});

/** One tab: icon over its label; the current section is in the accent colour. */
const Tab = ({
  activeOptions,
  badge,
  description,
  icon: Icon,
  label,
  to,
}: {
  activeOptions?: { exact?: boolean; includeSearch?: boolean };
  badge?: ReactNode;
  /** Read after the label ("Today, 9 items need attention"); the badge itself is decoration. */
  description?: string;
  icon: LucideIcon;
  label: string;
  to: LinkProps["to"];
}) => (
  <Link
    activeOptions={activeOptions}
    className="text-muted-foreground data-[status=active]:text-primary relative flex h-13 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors active:opacity-70"
    to={to}
  >
    <span className="relative">
      <Icon className="size-6 [stroke-width:1.75] in-data-[status=active]:[stroke-width:2.25]" />
      {badge}
    </span>
    {label}
    {description !== undefined && (
      <span className="sr-only">, {description}</span>
    )}
  </Link>
);

/**
 * Phones: a bar docked to the bottom edge with the four sections, labelled, and
 * Quick add in the middle. Settings opens from the avatar on each section's home.
 */
const MobileNav = () => {
  const { t } = useTranslation();
  const today = useTodayCount();

  return (
    <nav
      aria-label={t("appName")}
      className="tabbar-dock fixed inset-x-0 bottom-0 z-40 [view-transition-name:tabbar] md:hidden"
      data-tabbar
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-center px-1">
        <Tab
          activeOptions={{ exact: true, includeSearch: false }}
          badge={
            today.count > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  "ring-card absolute -top-1.5 -right-3 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-xs leading-none font-semibold tabular-nums ring-2",
                  today.overdue
                    ? "bg-destructive text-white"
                    : "bg-primary text-primary-foreground"
                )}
              >
                {today.count}
              </span>
            )
          }
          description={
            today.count > 0
              ? t("nav.needsAttention", { count: today.count })
              : undefined
          }
          icon={Sun}
          label={t("nav.today")}
          to="/"
        />
        <Tab icon={CarFront} label={t("nav.garage")} to="/garage" />
        <div className="flex justify-center">
          <QuickAdd />
        </div>
        <Tab icon={Wallet} label={t("nav.finances")} to="/finances" />
        <Tab icon={Dumbbell} label={t("nav.fitness")} to="/fitness" />
      </div>
    </nav>
  );
};

export const AppShell = () => {
  const main = useRef<HTMLElement>(null);
  useSwipeBack(main);

  return (
    <CommandMenuProvider>
      <div className="bg-background flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col md:py-2 md:pr-2">
          <main
            className="bg-background md:bg-card pt-safe-2 pb-safe-24 relative flex-1 px-4 md:min-h-[calc(100dvh-var(--spacing)*4)] md:rounded-lg md:border md:p-0"
            ref={main}
          >
            <RouteProgress />
            <PageOutlet />
          </main>
          <MobileNav />
        </div>
      </div>
      <Suspense fallback={null}>
        <EntryDialogHost />
        <FinanceDialogHost />
        <FitnessDialogHost />
      </Suspense>
      <DoneTickHost />
    </CommandMenuProvider>
  );
};
