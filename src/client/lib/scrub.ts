/**
 * Which of `count` equal-width columns a pointer at `x` (relative to the
 * chart's left edge, `width` wide) is over; clamped to the ends so dragging
 * past the chart keeps the first or last column.
 */
export const scrubIndex = (x: number, width: number, count: number): number => {
  if (count <= 0 || width <= 0) {
    return 0;
  }

  const index = Math.floor((x / width) * count);

  return Math.min(count - 1, Math.max(0, index));
};
