import { useQuery } from "@tanstack/react-query";
import { Link, Outlet } from "@tanstack/react-router";
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

/** One tab: the icon is bolder and the label darker when it is the current section. */
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
    className="text-muted-foreground data-[status=active]:text-foreground group/tab flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors"
    to={to}
  >
    <span className="relative flex">
      <Icon className="size-5.5 [stroke-width:1.75] group-data-[status=active]/tab:[stroke-width:2.25]" />
      {badge}
    </span>
    {label}
  </Link>
);

/** Phones: four sections and, in the middle, Quick add. */
const MobileNav = () => {
  const { t } = useTranslation();
  const today = useTodayCount();

  return (
    <nav
      aria-label={t("appName")}
      className="bg-card pb-safe fixed inset-x-0 bottom-0 z-40 border-t [view-transition-name:tabbar] md:hidden"
    >
      <div className="flex h-14 items-stretch">
        <Tab
          activeOptions={{ exact: true, includeSearch: false }}
          badge={
            today.count > 0 && (
              <span
                className={cn(
                  "ring-card absolute -top-0.5 -right-1 size-2 rounded-full ring-2",
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
        <QuickAdd />
        <Tab icon={Wallet} label={t("nav.finances")} to="/finances" />
        <Tab icon={Settings} label={t(SETTINGS_LABEL)} to={SETTINGS} />
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
            className="bg-background md:bg-card relative flex-1 px-4 pt-2 pb-24 md:min-h-[calc(100dvh-1rem)] md:rounded-lg md:border md:p-0"
            ref={main}
          >
            <RouteProgress />
            {/* The page snapshot for route transitions (see styles.css). */}
            <div className="[view-transition-name:page]">
              <Outlet />
            </div>
          </main>
          <MobileNav />
        </div>
      </div>
      <EntryDialogHost />
      <FinanceDialogHost />
    </CommandMenuProvider>
  );
};
