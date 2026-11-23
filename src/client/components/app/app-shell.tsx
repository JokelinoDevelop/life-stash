import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { LinkProps } from "@tanstack/react-router";
import {
  CarFront,
  ChevronsUpDown,
  LogOut,
  Search,
  Settings,
  Sun,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRef } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { usePreferences } from "@/lib/session";
import { useSignOut } from "@/lib/use-sign-out";
import { cn } from "@/lib/utils";
import { FinanceDialogHost } from "@/modules/finances/dialogs/finance-dialog-host";
import { FinanceNavLinks } from "@/modules/finances/finance-nav-links";
import { EntryDialogHost } from "@/modules/garage/entry-dialogs/entry-dialog-host";
import { householdOverviewQuery } from "@/modules/garage/household/household.queries";
import { useTodayCount } from "@/modules/today/today-view";

import { CommandMenuProvider } from "./command-menu";
import { useCommandMenu } from "./command-menu-context";
import { DoneTickHost } from "./done-tick";
import { PageOutlet } from "./page-outlet";
import { QuickAdd } from "./quick-add";
import { RouteProgress } from "./route-progress";
import { GarageLinks, ModuleGroup } from "./sidebar-modules";
import { activeNavLinkClass, navLinkClass, subLinkClass } from "./sidebar-nav";
import { useSwipeBack } from "./use-swipe-back";

const SETTINGS = "/settings";
const SETTINGS_LABEL = "nav.settings";

const Initial = ({ name }: { name: string }) => (
  <span className="bg-foreground text-background flex size-5 shrink-0 items-center justify-center rounded-sm text-xs font-bold">
    {name.slice(0, 1).toLocaleUpperCase()}
  </span>
);

/** The household's mark and name (a label, not a menu). */
export const HouseholdName = ({ className }: { className?: string }) => {
  const { t } = useTranslation();
  const household = useQuery(householdOverviewQuery);
  const name = household.data?.householdName ?? t("appName");

  return (
    <div
      className={cn(
        "flex h-8 min-w-0 items-center gap-2 px-2 text-sm font-semibold",
        className
      )}
    >
      <Initial name={name} />
      <span className="min-w-0 flex-1 truncate">{name}</span>
    </div>
  );
};

/** Bottom of the sidebar: who is signed in; opens Settings and Log out. */
const AccountMenu = () => {
  const { t } = useTranslation();
  const { t: ta } = useTranslation("auth");
  const preferences = usePreferences();
  const handleSignOut = useSignOut();
  const name = preferences.data?.displayName ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            className="hover:bg-sidebar-accent data-popup-open:bg-sidebar-accent flex h-9 min-w-0 items-center gap-2 rounded-md px-2 text-left text-sm font-medium outline-none"
            type="button"
          >
            <span className="bg-muted text-subtle-foreground flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
              {name.slice(0, 1).toLocaleUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate">{name}</span>
            <ChevronsUpDown className="text-muted-foreground/70 size-3.5 shrink-0" />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-52" side="top">
        <DropdownMenuItem render={<Link to={SETTINGS} />}>
          <Settings />
          {t(SETTINGS_LABEL)}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            void handleSignOut();
          }}
        >
          <LogOut />
          {ta("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const SearchButton = () => {
  const { t } = useTranslation("command");
  const { open: handleOpenMenu } = useCommandMenu();

  return (
    <button
      className="bg-card text-muted-foreground hover:text-foreground mt-1.5 mb-2.5 flex h-8 w-full items-center gap-2 rounded-md border pr-1.5 pl-2 text-left text-sm whitespace-nowrap transition-colors"
      onClick={handleOpenMenu}
      type="button"
    >
      <Search className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{t("searchOrRun")}</span>
      <Kbd className="shrink-0">⌘K</Kbd>
    </button>
  );
};

const NavCount = ({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "destructive";
}) => (
  <span
    className={cn(
      "ml-auto text-xs tabular-nums",
      tone === "destructive"
        ? "text-destructive font-medium"
        : "text-muted-foreground"
    )}
  >
    {children}
  </span>
);

const Sidebar = () => {
  const { t } = useTranslation();
  const today = useTodayCount();

  return (
    <aside className="bg-sidebar sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-px overflow-y-auto px-2 py-2.5 md:flex">
      <HouseholdName />
      <SearchButton />
      <nav aria-label={t("appName")} className="flex flex-col gap-px">
        <Link
          activeOptions={{ exact: true, includeSearch: false }}
          activeProps={{ className: activeNavLinkClass }}
          className={navLinkClass}
          to="/"
        >
          <Sun />
          {t("nav.today")}
          {today.count > 0 && (
            <NavCount tone={today.overdue ? "destructive" : "muted"}>
              {today.count}
            </NavCount>
          )}
        </Link>
        <ModuleGroup
          icon={<CarFront />}
          id="garage"
          label={t("nav.garage")}
          to="/garage"
        >
          <GarageLinks />
        </ModuleGroup>
        <ModuleGroup
          icon={<Wallet />}
          id="finances"
          label={t("nav.finances")}
          to="/finances"
        >
          <FinanceNavLinks
            activeClassName={activeNavLinkClass}
            className={subLinkClass}
          />
        </ModuleGroup>
      </nav>
      <div className="mt-auto flex flex-col gap-px pt-6">
        <AccountMenu />
      </div>
    </aside>
  );
};

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
    className="text-muted-foreground data-[status=active]:bg-primary/12 data-[status=active]:text-primary relative flex h-12 w-15 items-center justify-center rounded-full transition-colors active:opacity-70"
    to={to}
  >
    <Icon className="size-6 [stroke-width:1.75] in-data-[status=active]:[stroke-width:2.25]" />
    {badge}
  </Link>
);

/**
 * Phones (Linear-style): an icon-only capsule of the four sections with Quick
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
            className="bg-background md:bg-card pt-safe-2 pb-safe-28 relative flex-1 overflow-x-clip px-4 md:min-h-[calc(100dvh-1rem)] md:rounded-lg md:border md:p-0"
            ref={main}
          >
            <RouteProgress />
            <PageOutlet />
          </main>
          <MobileNav />
        </div>
      </div>
      <EntryDialogHost />
      <FinanceDialogHost />
      <DoneTickHost />
    </CommandMenuProvider>
  );
};
