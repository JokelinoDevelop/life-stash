/**
 * A small fixed palette for category icons on phones (v0.5). Each tint is a
 * theme token (`--tint-*` in styles.css) tuned for both light and dark mode.
 * `slate` is the neutral fallback.
 */
export const TINTS = [
  "blue",
  "green",
  "orange",
  "amber",
  "purple",
  "pink",
  "teal",
  "slate",
] as const;

export type Tint = (typeof TINTS)[number];

/**
 * Tile classes per tint. Phones only: desktop keeps the neutral tile.
 * Written out in full so Tailwind sees every class.
 */
export const TINT_TILE: Record<Tint, string> = {
  amber:
    "max-md:border-transparent max-md:bg-tint-amber/15 max-md:text-tint-amber",
  blue: "max-md:border-transparent max-md:bg-tint-blue/15 max-md:text-tint-blue",
  green:
    "max-md:border-transparent max-md:bg-tint-green/15 max-md:text-tint-green",
  orange:
    "max-md:border-transparent max-md:bg-tint-orange/15 max-md:text-tint-orange",
  pink: "max-md:border-transparent max-md:bg-tint-pink/15 max-md:text-tint-pink",
  purple:
    "max-md:border-transparent max-md:bg-tint-purple/15 max-md:text-tint-purple",
  slate:
    "max-md:border-transparent max-md:bg-tint-slate/15 max-md:text-tint-slate",
  teal: "max-md:border-transparent max-md:bg-tint-teal/15 max-md:text-tint-teal",
};
