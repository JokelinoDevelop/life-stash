/** One row rhythm: every top-level row is 28px with the same 16px icon column. */
export const navLinkClass =
  "relative flex h-7 items-center gap-2 rounded-md px-2 text-sm font-medium text-sidebar-foreground transition-colors duration-(--motion-fast) hover:bg-sidebar-accent/60 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground [&_svg]:transition-colors";

/**
 * The current page. Its pill is the shared `ActiveIndicator` sliding underneath (so it glides
 * between rows); the row itself only brightens its text and icon.
 */
export const activeNavLinkClass =
  "text-sidebar-accent-foreground hover:bg-transparent [&_svg]:text-sidebar-accent-foreground";

/** A module's pages, hanging off the guide line (no icon, lighter text). */
export const subLinkClass =
  "relative flex h-7 items-center gap-2 rounded-md px-2 text-sm text-subtle-foreground transition-colors duration-(--motion-fast) hover:bg-sidebar-accent/60 hover:text-sidebar-foreground";

export const activeSubLinkClass =
  "font-medium text-sidebar-accent-foreground hover:bg-transparent";
