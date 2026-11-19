import { Link, Outlet } from "@tanstack/react-router";
import { Search, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

import { APP_MODULES } from "@/app/modules";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

import { CommandMenuProvider } from "./command-menu";
import { useCommandMenu } from "./command-menu-context";

const navLinkClass =
  "flex h-8 items-center gap-2.5 rounded-md px-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&_svg]:text-muted-foreground";

const activeNavLinkClass =
  "bg-sidebar-accent text-sidebar-accent-foreground [&_svg]:text-sidebar-accent-foreground";

const mobileLinkClass =
  "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground";

const activeMobileLinkClass = "text-foreground";

const SearchButton = () => {
  const { t } = useTranslation("command");
  const { open: handleOpenMenu } = useCommandMenu();

  return (
    <button
      className="bg-card text-muted-foreground hover:text-foreground mb-3 flex h-8 w-full items-center gap-2 rounded-md border px-2 text-left text-sm transition-colors"
      onClick={handleOpenMenu}
      type="button"
    >
      <Search className="size-3.5" />
      <span className="flex-1">{t("search")}</span>
      <Kbd>⌘K</Kbd>
    </button>
  );
};

const Sidebar = () => {
  const { t } = useTranslation();

  return (
    <aside className="bg-sidebar sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r px-2 py-3 md:flex">
      <Link
        className="mb-3 flex h-8 items-center gap-2 px-2 text-sm font-semibold"
        to="/garage"
      >
        <img alt="" className="size-5" src="/icons/favicon.svg" />
        {t("appName")}
      </Link>
      <SearchButton />
      <nav className="flex flex-1 flex-col gap-px">
        {APP_MODULES.map((module) => (
          <Link
            activeProps={{ className: activeNavLinkClass }}
            className={navLinkClass}
            key={module.id}
            to={module.to}
          >
            <module.icon className="size-4" />
            {t(module.labelKey)}
          </Link>
        ))}
      </nav>
      <Link
        activeProps={{ className: activeNavLinkClass }}
        className={navLinkClass}
        to="/settings"
      >
        <Settings className="size-4" />
        {t("nav.settings")}
      </Link>
    </aside>
  );
};

const MobileNav = () => {
  const { t } = useTranslation();
  const { t: tCommand } = useTranslation("command");
  const { open: handleOpenMenu } = useCommandMenu();

  return (
    <nav
      className={cn(
        "bg-background/95 fixed inset-x-0 bottom-0 z-40 flex border-t backdrop-blur md:hidden",
        "pb-safe"
      )}
    >
      {APP_MODULES.map((module) => (
        <Link
          activeProps={{ className: activeMobileLinkClass }}
          className={mobileLinkClass}
          key={module.id}
          to={module.to}
        >
          <module.icon className="size-5" />
          {t(module.labelKey)}
        </Link>
      ))}
      <button
        className={mobileLinkClass}
        onClick={handleOpenMenu}
        type="button"
      >
        <Search className="size-5" />
        {tCommand("search")}
      </button>
      <Link
        activeProps={{ className: activeMobileLinkClass }}
        className={mobileLinkClass}
        to="/settings"
      >
        <Settings className="size-5" />
        {t("nav.settings")}
      </Link>
    </nav>
  );
};

export const AppShell = () => (
  <CommandMenuProvider>
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-24 md:px-8 md:pt-8 md:pb-10">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  </CommandMenuProvider>
);
