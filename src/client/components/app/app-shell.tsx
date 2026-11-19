import { useQuery } from "@tanstack/react-query";
import { Link, Outlet } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  CarFront,
  ChevronsUpDown,
  History,
  LayoutGrid,
  LogOut,
  Search,
  Settings,
} from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { useSignOut } from "@/lib/use-sign-out";
import { cn } from "@/lib/utils";
import { CarMonogram } from "@/modules/garage/cars/car-monogram";
import { carsQuery } from "@/modules/garage/cars/cars.queries";
import { householdOverviewQuery } from "@/modules/garage/household/household.queries";

import { CommandMenuProvider } from "./command-menu";
import { useCommandMenu } from "./command-menu-context";

const SETTINGS = "/settings";
const SETTINGS_LABEL = "nav.settings";

const navLinkClass =
  "flex h-7 items-center gap-2 rounded-md px-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";

const activeNavLinkClass =
  "bg-sidebar-accent text-sidebar-accent-foreground [&_svg]:text-sidebar-accent-foreground";

const mobileLinkClass =
  "flex min-h-13 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground";

const activeMobileLinkClass = "text-foreground";

/** The household's mark and name; a menu with Settings and Sign out. */
export const HouseholdMenu = ({ className }: { className?: string }) => {
  const { t } = useTranslation();
  const { t: ta } = useTranslation("auth");
  const household = useQuery(householdOverviewQuery);
  const handleSignOut = useSignOut();
  const name = household.data?.householdName ?? t("appName");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "hover:bg-sidebar-accent flex h-8 min-w-0 items-center gap-2 rounded-md px-2 text-left text-sm font-semibold outline-none",
            className
          )}
          type="button"
        >
          <span className="bg-foreground text-background flex size-5 shrink-0 items-center justify-center rounded-sm text-xs font-bold">
            {name.slice(0, 1).toLocaleUpperCase()}
          </span>
          <span className="min-w-0 flex-1 truncate">{name}</span>
          <ChevronsUpDown className="text-muted-foreground/70 size-3.5 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuItem asChild>
          <Link to={SETTINGS}>
            <Settings />
            {t(SETTINGS_LABEL)}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
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
      className="bg-card text-muted-foreground hover:text-foreground mt-1.5 mb-2.5 flex h-7 w-full items-center gap-2 rounded-md border pr-1.5 pl-2 text-left text-sm transition-colors"
      onClick={handleOpenMenu}
      type="button"
    >
      <Search className="size-3.5" />
      <span className="flex-1">{t("searchOrRun")}</span>
      <Kbd>⌘K</Kbd>
    </button>
  );
};

const NavCount = ({ children }: { children: ReactNode }) => (
  <span className="text-muted-foreground ml-auto text-xs tabular-nums">
    {children}
  </span>
);

const Sidebar = () => {
  const { t } = useTranslation();
  const cars = useQuery(carsQuery(false));
  const household = useQuery(householdOverviewQuery);

  const attention = (household.data?.reminders ?? []).filter(
    (reminder) => reminder.status !== "upcoming"
  ).length;

  return (
    <aside className="bg-sidebar sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-px overflow-y-auto px-2 py-2.5 md:flex">
      <HouseholdMenu />
      <SearchButton />
      <nav aria-label={t("appName")} className="flex flex-col gap-px">
        <Link
          activeOptions={{ exact: true }}
          activeProps={{ className: activeNavLinkClass }}
          className={navLinkClass}
          to="/garage"
        >
          <LayoutGrid />
          {t("nav.overview")}
        </Link>
        <Link
          activeProps={{ className: activeNavLinkClass }}
          className={navLinkClass}
          to="/garage/reminders"
        >
          <Bell />
          {t("nav.reminders")}
          {attention > 0 && <NavCount>{attention}</NavCount>}
        </Link>
        <Link
          activeProps={{ className: activeNavLinkClass }}
          className={navLinkClass}
          to="/garage/history"
        >
          <History />
          {t("nav.history")}
        </Link>
        <Link
          activeProps={{ className: activeNavLinkClass }}
          className={navLinkClass}
          to="/garage/catalog"
        >
          <BookOpen />
          {t("nav.catalog")}
        </Link>
        {(cars.data?.cars.length ?? 0) > 0 && (
          <p className="text-muted-foreground px-2 pt-4 pb-1 text-xs font-medium">
            {t("nav.cars")}
          </p>
        )}
        {cars.data?.cars.map((car) => (
          <Link
            activeProps={{ className: activeNavLinkClass }}
            className={navLinkClass}
            key={car.id}
            params={{ carId: car.id }}
            to="/garage/cars/$carId"
          >
            <CarMonogram name={car.name} size="xs" />
            <span className="truncate">{car.name}</span>
            {car.overdueCount > 0 && (
              <span
                aria-hidden="true"
                className="bg-destructive ml-auto size-1.5 shrink-0 rounded-full"
              />
            )}
          </Link>
        ))}
      </nav>
      <div className="mt-auto pt-6">
        <Link
          activeProps={{ className: activeNavLinkClass }}
          className={navLinkClass}
          to={SETTINGS}
        >
          <Settings />
          {t(SETTINGS_LABEL)}
        </Link>
      </div>
    </aside>
  );
};

const MobileNav = () => {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t("appName")}
      className="bg-card pb-safe fixed inset-x-0 bottom-0 z-40 flex border-t md:hidden"
    >
      <Link
        activeOptions={{ exact: false }}
        activeProps={{ className: activeMobileLinkClass }}
        className={mobileLinkClass}
        to="/garage"
      >
        <CarFront className="size-5" />
        {t("nav.garage")}
      </Link>
      <Link
        activeProps={{ className: activeMobileLinkClass }}
        className={mobileLinkClass}
        to="/garage/reminders"
      >
        <Bell className="size-5" />
        {t("nav.reminders")}
      </Link>
      <Link
        activeProps={{ className: activeMobileLinkClass }}
        className={mobileLinkClass}
        to={SETTINGS}
      >
        <Settings className="size-5" />
        {t(SETTINGS_LABEL)}
      </Link>
    </nav>
  );
};

export const AppShell = () => (
  <CommandMenuProvider>
    <div className="bg-background flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col md:py-2 md:pr-2">
        <main className="md:bg-card flex-1 px-4 pt-2 pb-24 md:min-h-[calc(100dvh-1rem)] md:rounded-lg md:border md:p-0">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  </CommandMenuProvider>
);
