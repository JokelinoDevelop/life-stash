import { Outlet, useRouterState } from "@tanstack/react-router";
import { useLayoutEffect, useRef } from "react";

import { phonePageEnters } from "@/lib/nav-transition";

const PHONE_QUERY = "(max-width: 47.999rem)";
const PAGE_ENTER = "animate-page-enter";

/**
 * The page. Desktop: its snapshot cross-fades on route changes (view
 * transitions, see styles.css). Phones: a drilled-into page slides in as it
 * renders (before paint, so the old page never flashes in its place).
 */
export const PageOutlet = () => {
  const page = useRef<HTMLDivElement>(null);

  // The rendered page's path (the location changes before its loader ends).
  const pathname = useRouterState({
    select: (state) => (state.resolvedLocation ?? state.location).pathname,
  });

  const previous = useRef(pathname);

  useLayoutEffect(() => {
    const from = previous.current;
    previous.current = pathname;
    const element = page.current;

    if (
      from === pathname ||
      element === null ||
      !window.matchMedia(PHONE_QUERY).matches ||
      !phonePageEnters(from, pathname)
    ) {
      return;
    }

    if (element.classList.contains(PAGE_ENTER)) {
      // Still sliding from the last drill-down: start over.
      for (const animation of element.getAnimations()) {
        animation.currentTime = 0;
      }
    } else {
      element.classList.add(PAGE_ENTER);
    }
  }, [pathname]);

  return (
    <div
      className="[view-transition-name:page]"
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) {
          event.currentTarget.classList.remove(PAGE_ENTER);
        }
      }}
      ref={page}
    >
      <Outlet />
    </div>
  );
};
