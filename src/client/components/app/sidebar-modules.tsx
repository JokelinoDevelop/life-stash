import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { CarMonogram } from "@/modules/garage/cars/car-monogram";
import { carsQuery } from "@/modules/garage/cars/cars.queries";

import { activeNavLinkClass, navLinkClass, subLinkClass } from "./sidebar-nav";

const moduleLinkClass =
  "mt-2 flex h-7 items-center gap-2 rounded-md px-2 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent [&_svg]:size-4 [&_svg]:shrink-0";

/** A top-level module in the sidebar: its name, and its pages when it is the active one. */
export const ModuleGroup = ({
  active,
  children,
  icon,
  label,
  to,
}: {
  active: boolean;
  children: ReactNode;
  icon: ReactNode;
  label: string;
  to: "/garage" | "/finances";
}) => (
  <>
    <Link aria-expanded={active} className={moduleLinkClass} to={to}>
      <span className="text-subtle-foreground flex">{icon}</span>
      <span className="flex-1">{label}</span>
      {active ? (
        <ChevronDown aria-hidden="true" className="text-muted-foreground/70" />
      ) : (
        <ChevronRight aria-hidden="true" className="text-muted-foreground/70" />
      )}
    </Link>
    {active && children}
  </>
);

export const GarageLinks = () => {
  const { t } = useTranslation();
  const cars = useQuery(carsQuery(false));

  return (
    <>
      <Link
        activeOptions={{ exact: true }}
        activeProps={{ className: activeNavLinkClass }}
        className={subLinkClass}
        to="/garage"
      >
        {t("nav.overview")}
      </Link>
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
      {(cars.data?.cars.length ?? 0) > 0 && (
        <p className="text-muted-foreground px-2 pt-3 pb-1 pl-7.5 text-xs font-medium">
          {t("nav.cars")}
        </p>
      )}
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
            <span
              aria-hidden="true"
              className="bg-destructive ml-auto size-1.5 shrink-0 rounded-full"
            />
          )}
        </Link>
      ))}
    </>
  );
};
