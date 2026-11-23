let alreadyAnimated = false;

/** The next navigation was already animated (our swipe-back, or the browser's own). */
export const markAlreadyAnimated = () => {
  alreadyAnimated = true;
};

/** Call once at startup: iOS Safari's edge swipe animates back/forward itself; don't fade again. */
export const listenForBrowserTransitions = () => {
  window.addEventListener("popstate", (event) => {
    // Undefined (falsy) where unsupported.
    if (event.hasUAVisualTransition) {
      alreadyAnimated = true;
    }
  });
};

/**
 * The router's `defaultViewTransition.types`: pages cross-fade when the path
 * changes (see `::view-transition-*(page)` in styles.css). Search-only changes
 * (dialogs, tabs, filters) and back swipes that already animated stay instant.
 */
export const pageTransitionTypes = ({
  pathChanged,
}: {
  pathChanged: boolean;
}): string[] | false => {
  const animated = alreadyAnimated;
  alreadyAnimated = false;

  return pathChanged && !animated ? ["page"] : false;
};
