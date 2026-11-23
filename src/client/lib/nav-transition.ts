let alreadyAnimated = false;
let wentBack = false;

/** How a route change moves on phones: deeper (push), back up (pop), across tabs, or in place. */
export type NavDirection = "push" | "pop" | "tab" | "same";

const segments = (path: string): string[] => path.split("/").filter(Boolean);

/** Sections whose sub-paths are tabs on one page, not drill-downs. */
const TABBED_SECTIONS = new Set(["settings"]);

/**
 * Drill-downs slide in (push) and out (pop); switching sections of the tab bar
 * fades. Going back (`back`, a popstate) to a shallower screen is always a pop,
 * even across sections (Today › car › Back).
 */
export const navDirection = (
  from: string,
  to: string,
  back = false
): NavDirection => {
  const fromParts = segments(from);
  const toParts = segments(to);
  const sameSection = (fromParts[0] ?? "") === (toParts[0] ?? "");

  if (sameSection && TABBED_SECTIONS.has(toParts[0] ?? "")) {
    return "same";
  }

  if (back && toParts.length < fromParts.length) {
    return "pop";
  }

  if (!sameSection && toParts.length <= 1) {
    return "tab";
  }

  if (toParts.length > fromParts.length) {
    return "push";
  }

  if (toParts.length < fromParts.length) {
    return "pop";
  }

  return sameSection ? "same" : "tab";
};

/** The next navigation was already animated (our swipe-back, or the browser's own). */
export const markAlreadyAnimated = () => {
  alreadyAnimated = true;
};

/** Call once at startup: iOS Safari's edge swipe animates back/forward itself; don't fade again. */
export const listenForBrowserTransitions = () => {
  window.addEventListener("popstate", (event) => {
    wentBack = true;

    // Undefined (falsy) where unsupported.
    if (event.hasUAVisualTransition) {
      alreadyAnimated = true;
    }
  });
};

/**
 * The router's `defaultViewTransition.types`: pages cross-fade when the path
 * changes (see `::view-transition-*(page)` in styles.css); on phones the
 * direction type (push / pop / tab) turns drill-downs into slides. Search-only
 * changes (dialogs, tabs, filters) and back swipes that already animated stay
 * instant.
 */
export const pageTransitionTypes = ({
  fromLocation,
  pathChanged,
  toLocation,
}: {
  fromLocation?: { pathname: string };
  pathChanged: boolean;
  toLocation: { pathname: string };
}): string[] | false => {
  const animated = alreadyAnimated;
  const back = wentBack;
  alreadyAnimated = false;
  wentBack = false;

  if (!pathChanged || animated) {
    return false;
  }

  const direction = navDirection(
    fromLocation?.pathname ?? "/",
    toLocation.pathname,
    back
  );

  return ["page", direction];
};
