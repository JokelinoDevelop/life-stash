import { Link, Outlet } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

import { APP_MODULES } from "@/app/modules";
import { cn } from "@/lib/utils";

const navLinkClass =
  "flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-muted-foreground text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

const activeNavLinkClass = "bg-sidebar-accent text-sidebar-accent-foreground";

const mobileLinkClass =
  "flex flex-1 flex-col items-center gap-1 py-2 text-muted-foreground text-xs";

const activeMobileLinkClass = "text-primary";

export const AppShell = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-dvh">
      <aside className="bg-sidebar sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r p-4 md:flex">
        <Link
          className="mb-6 flex items-center gap-2 px-2 text-lg font-semibold"
          to="/garage"
        >
          <img alt="" className="size-7" src="/icons/favicon.svg" />
          {t("appName")}
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
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
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-24 md:px-8 md:pt-8 md:pb-10">
          <Outlet />
        </main>
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
          <Link
            activeProps={{ className: activeMobileLinkClass }}
            className={mobileLinkClass}
            to="/settings"
          >
            <Settings className="size-5" />
            {t("nav.settings")}
          </Link>
        </nav>
      </div>
    </div>
  );
};
