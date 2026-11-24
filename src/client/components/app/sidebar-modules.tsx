import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { CarMonogram } from "@/modules/garage/cars/car-monogram";
import { carsQuery } from "@/modules/garage/cars/cars.queries";

import { activeNavLinkClass, navLinkClass, subLinkClass } from "./sidebar-nav";

const moduleLinkClass =
  "flex h-7 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent [&_svg]:size-4 [&_svg]:shrink-0";

const COLLAPSED_KEY = "lifestash.sidebar.collapsed";

const readCollapsed = (): string[] => {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(COLLAPSED_KEY) ?? "[]"
    );

    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
};

const writeCollapsed = (ids: string[]) => {
  try {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify(ids));
  } catch {
    // Private mode or blocked storage: the group just reopens next time.
  }
};

/**
 * A module in the sidebar: its name links to the module's overview, its pages
 * sit below. Groups stay open; the chevron collapses one by hand (remembered).
 */
export const ModuleGroup = ({
  children,
  icon,
  id,
  label,
  to,
}: {
  children: ReactNode;
  icon: ReactNode;
  id: string;
  label: string;
  to: "/garage" | "/finances" | "/fitness";
}) => {
  const { t } = useTranslation();

  const [collapsed, setCollapsed] = useState(() =>
    readCollapsed().includes(id)
  );

  const handleToggle = () => {
    const next = !collapsed;
    const others = readCollapsed().filter((item) => item !== id);
    writeCollapsed(next ? [...others, id] : others);
    setCollapsed(next);
  };

  return (
    <div className="mt-3 flex flex-col gap-px">
      <div className="group/module flex items-center">
        <Link
          activeOptions={{ exact: true, includeSearch: false }}
          activeProps={{ className: activeNavLinkClass }}
          className={moduleLinkClass}
          to={to}
        >
          <span className="text-subtle-foreground flex">{icon}</span>
          <span className="truncate">{label}</span>
        </Link>
        <button
          aria-expanded={!collapsed}
          aria-label={t(collapsed ? "nav.expand" : "nav.collapse", {
            name: label,
          })}
          className="text-muted-foreground/70 hover:bg-sidebar-accent hover:text-foreground ml-px flex size-7 shrink-0 items-center justify-center rounded-md opacity-0 transition group-hover/module:opacity-100 focus-visible:opacity-100"
          onClick={handleToggle}
          type="button"
        >
          <ChevronDown
            aria-hidden="true"
            className={cn("size-3.5 transition-transform", {
              "-rotate-90": collapsed,
            })}
          />
        </button>
      </div>
      {!collapsed && children}
    </div>
  );
};

/** Garage in the sidebar: the cars first (they are where you go most), then History and the Service catalog. */
export const GarageLinks = () => {
  const { t } = useTranslation();
  const cars = useQuery(carsQuery(false));

  return (
    <>
      {cars.data?.cars.map((car) => (
        <Link
          activeProps={{ className: activeNavLinkClass }}
          className={cn(navLinkClass, "pl-6.5")}
          key={car.id}
          params={{ carId: car.id }}
          to="/garage/cars/$carId"
        >
          <CarMonogram name={car.name} size="xs" />
          <span className="truncate">{car.name}</span>
          {car.overdueCount > 0 && (
            <>
              <span
                aria-hidden="true"
                className="bg-destructive text-primary-foreground ml-auto flex size-3.5 shrink-0 items-center justify-center rounded-full text-xs leading-none font-bold"
              >
                !
              </span>
              <span className="sr-only">{t("status.overdue")}</span>
            </>
          )}
        </Link>
      ))}
      <Link
        activeProps={{ className: activeNavLinkClass }}
        className={subLinkClass}
        to="/garage/history"
      >
        {t("nav.history")}
      </Link>
      <Link
        activeProps={{ className: activeNavLinkClass }}
        className={subLinkClass}
        to="/garage/catalog"
      >
        {t("nav.catalog")}
      </Link>
    </>
  );
};
