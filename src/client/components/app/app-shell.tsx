import { Link } from "@tanstack/react-router";
import type { LinkProps } from "@tanstack/react-router";
import { CarFront, Dumbbell, Settings, Sun, Wallet } from "lucide-react";
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

const SETTINGS = "/settings";
const SETTINGS_LABEL = "nav.settings";

/**
 * One tab: an icon (the label is for screen readers and the tooltip-less
 * touch UI reads it aloud); the current section sits on a tinted pill.
 */
const Tab = ({
  activeOptions,
  badge,
  icon: Icon,
  label,
  to,
}: {
  activeOptions?: { exact?: boolean; includeSearch?: boolean };
  badge?: ReactNode;
  icon: LucideIcon;
  label: string;
  to: LinkProps["to"];
}) => (
  <Link
    activeOptions={activeOptions}
    aria-label={label}
    className="text-muted-foreground data-[status=active]:bg-primary/12 data-[status=active]:text-primary relative flex h-12 w-12 items-center justify-center rounded-full transition-colors active:opacity-70 min-[380px]:w-13"
    to={to}
  >
    <Icon className="size-6 [stroke-width:1.75] in-data-[status=active]:[stroke-width:2.25]" />
    {badge}
  </Link>
);

/**
 * Phones (Linear-style): an icon-only capsule of the five sections with Quick
 * add as its own round button beside it. The page fades and blurs into the
 * canvas near the bottom edge, so rows never show through the bar.
 */
const MobileNav = () => {
  const { t } = useTranslation();
  const today = useTodayCount();

  return (
    <nav
      aria-label={t("appName")}
      className="tabbar-edge pointer-events-none fixed inset-x-0 bottom-0 z-40 [view-transition-name:tabbar] md:hidden"
      data-tabbar
    >
      <div className="tabbar-float pointer-events-auto absolute inset-x-0 z-10 flex items-center justify-center gap-3 px-4">
        <div className="tabbar-glass flex h-14 items-center gap-0.5 rounded-full px-1">
          <Tab
            activeOptions={{ exact: true, includeSearch: false }}
            badge={
              today.count > 0 && (
                <span
                  className={cn(
                    "ring-card absolute top-2.5 right-4 size-2 rounded-full ring-2",
                    today.overdue ? "bg-destructive" : "bg-primary"
                  )}
                >
                  <span className="sr-only">
                    {t("nav.needsAttention", { count: today.count })}
                  </span>
                </span>
              )
            }
            icon={Sun}
            label={t("nav.today")}
            to="/"
          />
          <Tab icon={CarFront} label={t("nav.garage")} to="/garage" />
          <Tab icon={Wallet} label={t("nav.finances")} to="/finances" />
          <Tab icon={Dumbbell} label={t("nav.fitness")} to="/fitness" />
          <Tab icon={Settings} label={t(SETTINGS_LABEL)} to={SETTINGS} />
        </div>
        <QuickAdd />
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
            className="bg-background md:bg-card pt-safe-2 pb-safe-28 relative flex-1 px-4 md:min-h-[calc(100dvh-var(--spacing)*4)] md:rounded-lg md:border md:p-0"
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
