import { haptic } from "./haptics";

let tick = 0;
const listeners = new Set<() => void>();

export const subscribeDoneTick = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

/** How many ticks have been shown; `DoneTickHost` re-renders when it grows. */
export const doneTickCount = (): number => tick;

/**
 * Celebrates a completed reminder: a check draws itself in the middle of the
 * screen for a moment (`DoneTickHost`), with a success haptic where supported.
 */
export const showDoneTick = (): void => {
  tick += 1;
  haptic("success");

  for (const listener of listeners) {
    listener();
  }
};
