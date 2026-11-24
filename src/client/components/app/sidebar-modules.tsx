import { Link, useRouterState } from "@tanstack/react-router";
import { useLayoutEffect, useRef, useState } from "react";
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
 * thin guide line. They open and close by animating the row height (150 ms), and closed ones
 * can't be tabbed into. The badge shows on the row while the module is closed.
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
        <span
          className={cn(
            "ml-auto flex transition-opacity duration-(--motion-fast)",
            open && "opacity-0"
          )}
        >
          {badge}
        </span>
      </Link>
      <div
        className={cn(
          "grid transition-all duration-(--motion-base) ease-(--ease-out)",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
        inert={!open}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-sidebar-border mb-1 ml-4 flex flex-col gap-px border-l pt-px pl-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Rows move while groups open and close: follow them for this long after a page change. */
const FOLLOW_MS = 260;

const measure = (container: HTMLElement): Box | null => {
  const active = container.querySelector<HTMLElement>(
    'a[data-status="active"]'
  );

  if (active === null) {
    return null;
  }

  const outer = container.getBoundingClientRect();
  const row = active.getBoundingClientRect();

  return {
    height: row.height,
    left: row.left - outer.left,
    top: row.top - outer.top + container.scrollTop,
    width: row.width,
  };
};

const boxKey = (box: Box | null) =>
  box === null ? "" : `${box.top}:${box.left}:${box.width}:${box.height}`;

const sameBox = (a: Box | null, b: Box | null) => boxKey(a) === boxKey(b);

/**
 * The current page's pill: one element that slides to the active row (and follows it while
 * groups animate), so switching pages reads as a glide rather than a jump.
 */
export const ActiveIndicator = ({
  container,
}: {
  /** The scrolling sidebar; null until it has mounted. */
  container: HTMLElement | null;
}) => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const [box, setBox] = useState<Box | null>(null);
  const [visible, setVisible] = useState(false);

  const lastPath = useRef<string | null>(null);

  useLayoutEffect(() => {
    const element = container;

    if (element === null) {
      return () => {
        // Nothing mounted to follow.
      };
    }

    // While the next page loads no row is active for a moment: keep the last position (faded)
    // so the pill glides from there instead of popping in.
    const update = () => {
      const next = measure(element);
      setVisible(next !== null);

      if (next !== null) {
        setBox((current) => (sameBox(current, next) ? current : next));
      }
    };

    update();
    // After a page change the rows move while groups open and close: follow them a moment.
    const changed = lastPath.current !== pathname;
    lastPath.current = pathname;
    const until = performance.now() + (changed ? FOLLOW_MS : 0);

    let frame = 0;

    const follow = (now: number) => {
      update();

      if (now < until) {
        frame = requestAnimationFrame(follow);
      }
    };

    frame = requestAnimationFrame(follow);

    const resize = new ResizeObserver(update);
    resize.observe(element);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
    };
  }, [container, pathname]);

  if (box === null) {
    return null;
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "bg-sidebar-accent pointer-events-none absolute top-0 left-0 h-(--pill-h) w-(--pill-w) translate-x-(--pill-x) translate-y-(--pill-y) rounded-md transition-all duration-(--motion-base) ease-(--ease-out)",
        !visible && "opacity-0"
      )}
      style={{
        "--pill-h": `${box.height}px`,
        "--pill-w": `${box.width}px`,
        "--pill-x": `${box.left}px`,
        "--pill-y": `${box.top}px`,
      }}
    />
  );
};
