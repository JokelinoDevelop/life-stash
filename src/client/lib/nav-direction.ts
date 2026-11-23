/** How a screen change animates on phones: deeper slides in, back slides out. */
export type NavDirection = "push" | "pop" | "fade";

const depth = (pathname: string) =>
  pathname.split("/").filter((segment) => segment !== "").length;

/**
 * Deeper is a push (a list into a detail, Today into a car), shallower is a
 * pop (back to the parent) and the same depth is a cross-fade. Tab-bar
 * switches are cross-fades whatever the depth (see `nav-transition.ts`).
 */
export const navDirection = (from: string, to: string): NavDirection => {
  const before = depth(from);
  const after = depth(to);

  if (after > before) {
    return "push";
  }

  if (after < before) {
    return "pop";
  }

  return "fade";
};
