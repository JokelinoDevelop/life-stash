import { useRouterState } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

export const navLinkClass =
  "flex h-7 items-center gap-2 rounded-md px-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";

export const activeNavLinkClass =
  "bg-sidebar-accent text-sidebar-accent-foreground [&_svg]:text-sidebar-accent-foreground";

type ModuleId = "garage" | "finances";

/** Finances pages (and their settings tab) belong to Finances; everything else to Garage. */
export const useActiveModule = (): ModuleId =>
  useRouterState({
    select: (state) =>
      state.location.pathname.startsWith("/finances") ||
      state.location.pathname.startsWith("/settings/finances")
        ? "finances"
        : "garage",
  });

export const subLinkClass = cn(navLinkClass, "pl-7.5");
