import type { ParsedLocation } from "@tanstack/react-router";

import { navDirection } from "./nav-direction";

const DESKTOP = "(min-width: 768px)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

let tabSwitch = false;
let alreadyAnimated = false;

/** The next navigation is a tab switch (bottom bar, settings tabs): cross-fade it. */
export const markTabSwitch = () => {
  tabSwitch = true;
};

/** The next navigation was already animated (our swipe-back, or the browser's own). */
export const markAlreadyAnimated = () => {
  alreadyAnimated = true;
};

/** Call once at startup: iOS Safari's edge swipe animates back/forward itself; don't slide again. */
export const listenForBrowserTransitions = () => {
  window.addEventListener("popstate", (event) => {
    // Undefined (falsy) where unsupported.
    if (event.hasUAVisualTransition) {
      alreadyAnimated = true;
    }
  });
};

const wantsMotion = () =>
  !window.matchMedia(DESKTOP).matches &&
  !window.matchMedia(REDUCED_MOTION).matches;

/**
 * The router's `defaultViewTransition.types`: on phones, screens slide in
 * (push), slide out (pop) or cross-fade (tabs, siblings); see styles.css.
 * Search-only changes (filters, tabs, pages) and desktop stay instant.
 */
export const navTransitionTypes = ({
  fromLocation,
  pathChanged,
  toLocation,
}: {
  fromLocation?: ParsedLocation;
  pathChanged: boolean;
  toLocation: ParsedLocation;
}): string[] | false => {
  const tab = tabSwitch;
  const animated = alreadyAnimated;
  tabSwitch = false;
  alreadyAnimated = false;

  if (!pathChanged || fromLocation === undefined || animated) {
    return false;
  }

  if (!wantsMotion()) {
    return false;
  }

  if (tab) {
    return ["fade"];
  }

  return [navDirection(fromLocation.pathname, toLocation.pathname)];
};
