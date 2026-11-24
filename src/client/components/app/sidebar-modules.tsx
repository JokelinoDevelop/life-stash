import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { activeNavLinkClass, navLinkClass } from "./sidebar-nav";

/** A count on a row: muted, red only when something is overdue. */
export const NavCount = ({
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

type ModulePath = "/garage" | "/finances" | "/fitness";

/**
 * A module in the sidebar: one row; only the module you're in shows its pages, hanging off a
 * thin guide line. The badge shows on the row while the module is closed.
 */
export const ModuleGroup = ({
  badge,
  children,
  icon,
  label,
  to,
}: {
  badge?: ReactNode;
  children: ReactNode;
  icon: ReactNode;
  label: string;
  to: ModulePath;
}) => {
  const open = useRouterState({
    select: (state) => state.location.pathname.startsWith(to),
  });

  return (
    <div className="flex flex-col gap-px">
      <Link
        activeOptions={{ exact: true, includeSearch: false }}
        activeProps={{ className: activeNavLinkClass }}
        className={navLinkClass}
        to={to}
      >
        {icon}
        <span className="truncate">{label}</span>
        {!open && badge}
      </Link>
      {open && (
        <div className="border-sidebar-border animate-fade mb-1 ml-4 flex flex-col gap-px border-l pl-2">
          {children}
        </div>
      )}
    </div>
  );
};
