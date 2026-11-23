/**
 * Query options that take whatever is cached (even stale) without waiting.
 * In a route loader the page's own queries then refresh it in the background.
 */
export const cached = <Options extends object>(options: Options) => ({
  ...options,
  staleTime: "static" as const,
});

/**
 * For route loaders: wait for what a page shows before it mounts, so the
 * screen opens with its content instead of a skeleton (links preload on
 * touch, so this usually finishes before the finger lifts). Pass
 * `queryClient.query(cached(...))` calls. Failures are left to the page's
 * `ErrorState`, never thrown here.
 */
export const warm = async (...loads: Promise<unknown>[]): Promise<void> => {
  await Promise.allSettled(loads);
};
