/**
 * A short vibration where the platform offers one (Android Chrome). iOS Safari
 * has no web vibration API, so this is silently a no-op there.
 */
const PATTERNS = {
  /** Crossing a threshold (a swipe that will act on release). */
  tick: [8],
  /** Something completed. */
  success: [10, 40, 18],
} as const satisfies Record<string, readonly number[]>;

export const haptic = (kind: keyof typeof PATTERNS = "tick"): void => {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) {
    return;
  }

  try {
    navigator.vibrate([...PATTERNS[kind]]);
  } catch {
    // Blocked (no user gesture yet, or disabled): feedback is optional.
  }
};
