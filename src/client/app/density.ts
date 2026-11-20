/**
 * UI size: "comfortable" (default: larger type and controls) or "compact"
 * (the denser v0.3 scale). Toggled from the command menu, stored per device,
 * applied as `data-density` on <html> (see styles.css).
 */
export type Density = "compact" | "comfortable";

const STORAGE_KEY = "lifestash.density";

export const readDensity = (): Density => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "compact"
      ? "compact"
      : "comfortable";
  } catch {
    return "comfortable";
  }
};

export const applyDensity = (density: Density) => {
  document.documentElement.dataset.density = density;
};

export const toggleDensity = (): Density => {
  const next: Density =
    readDensity() === "comfortable" ? "compact" : "comfortable";

  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage unavailable: the size still applies for this session.
  }

  applyDensity(next);

  return next;
};
