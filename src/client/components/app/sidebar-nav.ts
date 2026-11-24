import { cn } from "@/lib/utils";

/** One row rhythm: every top-level row is 28px with the same 16px icon column. */
export const navLinkClass =
  "flex h-7 items-center gap-2 rounded-md px-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";

/** The current page: a quiet filled pill. */
export const activeNavLinkClass =
  "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent [&_svg]:text-sidebar-accent-foreground";

/** A module's pages, hanging off the guide line (no icon, lighter text). */
export const subLinkClass = cn(
  "text-subtle-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground flex h-7 items-center gap-2 rounded-md px-2 text-sm transition-colors"
);

export const activeSubLinkClass =
  "bg-sidebar-accent font-medium text-sidebar-accent-foreground hover:bg-sidebar-accent";
