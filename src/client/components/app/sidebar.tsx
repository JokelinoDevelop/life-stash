import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  CarFront,
  ChevronsUpDown,
  Dumbbell,
  LogOut,
  Monitor,
  Moon,
  Search,
  Settings,
  Sun,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/app/theme";
import type { Theme } from "@/app/theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { todayIso } from "@/lib/partial-date";
import { usePreferences } from "@/lib/session";
import { useSignOut } from "@/lib/use-sign-out";
import { cn } from "@/lib/utils";
import { FinanceNavLinks } from "@/modules/finances/finance-nav-links";
import { invoicesQuery } from "@/modules/finances/invoices/invoices.queries";
import { FitnessNavLinks } from "@/modules/fitness/fitness-nav-links";
import { fitnessOverviewQuery } from "@/modules/fitness/fitness.queries";
import { plannedToday } from "@/modules/fitness/overview/planned-today";
import { carsQuery } from "@/modules/garage/cars/cars.queries";
import { useTodayCount } from "@/modules/today/today-view";

import { useCommandMenu } from "./command-menu-context";
import { HouseholdName } from "./household-name";
import { ActiveIndicator, ModuleGroup, NavCount } from "./sidebar-modules";
import {
  activeNavLinkClass,
  activeSubLinkClass,
  navLinkClass,
  subLinkClass,
} from "./sidebar-nav";

const SETTINGS = "/settings";

/** Bottom of the sidebar: who is signed in; opens Settings and Log out. */
const AccountMenu = () => {
  const { t: ta } = useTranslation("auth");
  const preferences = usePreferences();
  const handleSignOut = useSignOut();
  const name = preferences.data?.displayName ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            className="hover:bg-sidebar-accent/60 data-popup-open:bg-sidebar-accent flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-left text-sm font-medium outline-none"
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

/** Search as a quiet row; ⌘K opens the same menu. */
const SearchRow = () => {
  const { t } = useTranslation("command");
  const { open: handleOpenMenu } = useCommandMenu();

  return (
    <button
      className={cn(navLinkClass, "text-muted-foreground w-full text-left")}
      onClick={handleOpenMenu}
      type="button"
    >
      <Search />
      <span className="min-w-0 flex-1 truncate font-normal">{t("search")}</span>
      <Kbd className="shrink-0">⌘K</Kbd>
    </button>
  );
};

/** Light → dark → system, as one icon button beside your name. */
const THEME_ORDER: readonly Theme[] = ["system", "light", "dark"];

const THEME_ICON = { dark: Moon, light: Sun, system: Monitor } as const;

const ThemeToggle = () => {
  const { t } = useTranslation("settings");
  const { theme, setTheme } = useTheme();
  const Icon = THEME_ICON[theme];

  const label = t("preferences.themeIs", {
    theme: t(`preferences.themes.${theme}`),
  });

  const next =
    THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length] ??
    "system";

  return (
    <Button
      aria-label={label}
      onClick={() => {
        setTheme(next);
      }}
      size="icon-compact"
      title={label}
      variant="ghost"
    >
      <Icon />
    </Button>
  );
};

/** Garage: red count of cars with an overdue reminder. */
const GarageBadge = () => {
  const cars = useQuery(carsQuery(false));

  const overdue = (cars.data?.cars ?? []).filter(
    (car) => car.overdueCount > 0
  ).length;

  return overdue > 0 ? <NavCount tone="destructive">{overdue}</NavCount> : null;
};

/** Finances: red count of overdue invoices. */
const FinancesBadge = () => {
  const year = Number(todayIso().slice(0, 4));
  const unpaid = useQuery(invoicesQuery({ status: "unpaid", year }));
  const overdue = unpaid.data?.stats.overdueCount ?? 0;

  return overdue > 0 ? <NavCount tone="destructive">{overdue}</NavCount> : null;
};

/** Fitness: trainings still to do today (muted). */
const FitnessBadge = () => {
  const overview = useQuery(fitnessOverviewQuery);
  const planned = plannedToday(overview.data);

  return planned > 0 ? <NavCount>{planned}</NavCount> : null;
};

/** Desktop navigation: Today, the modules (only the open one shows its pages), then Settings and you. */
export const Sidebar = () => {
  const { t } = useTranslation();
  const today = useTodayCount();
  // A callback ref: the pill measures once the sidebar exists (a plain ref is still empty
  // when the child's layout effect runs).
  const [aside, setAside] = useState<HTMLElement | null>(null);

  return (
    <aside
      className="bg-sidebar sticky top-0 hidden h-dvh w-60 shrink-0 flex-col overflow-y-auto px-2 py-2.5 md:flex"
      ref={setAside}
    >
      <ActiveIndicator container={aside} />
      <HouseholdName className="mb-2" />
      <nav aria-label={t("appName")} className="flex flex-col gap-px">
        <SearchRow />
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
        <div className="text-muted-foreground mt-4 mb-1 px-2 text-xs font-medium">
          {t("nav.modules")}
        </div>
        <ModuleGroup
          badge={<GarageBadge />}
          icon={<CarFront />}
          label={t("nav.garage")}
          to="/garage"
        >
          <Link
            activeProps={{ className: activeSubLinkClass }}
            className={subLinkClass}
            to="/garage/history"
          >
            {t("nav.history")}
          </Link>
        </ModuleGroup>
        <ModuleGroup
          badge={<FinancesBadge />}
          icon={<Wallet />}
          label={t("nav.finances")}
          to="/finances"
        >
          <FinanceNavLinks
            activeClassName={activeSubLinkClass}
            className={subLinkClass}
          />
        </ModuleGroup>
        <ModuleGroup
          badge={<FitnessBadge />}
          icon={<Dumbbell />}
          label={t("nav.fitness")}
          to="/fitness"
        >
          <FitnessNavLinks
            activeClassName={activeSubLinkClass}
            className={subLinkClass}
          />
        </ModuleGroup>
      </nav>
      <div className="mt-auto flex flex-col gap-px pt-6">
        <Link
          activeProps={{ className: activeNavLinkClass }}
          className={navLinkClass}
          to={SETTINGS}
        >
          <Settings />
          {t("nav.settings")}
        </Link>
        <div className="flex items-center gap-1">
          <AccountMenu />
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
};
