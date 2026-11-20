import { cn } from "@/lib/utils";

export const navLinkClass =
  "flex h-7 items-center gap-2 rounded-md px-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";

export const activeNavLinkClass =
  "bg-sidebar-accent text-sidebar-accent-foreground [&_svg]:text-sidebar-accent-foreground";

export const subLinkClass = cn(navLinkClass, "pl-7.5");
