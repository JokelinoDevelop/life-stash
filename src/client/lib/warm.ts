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

const DIALOG_WAIT_MS = 400;

/**
 * For opening a dialog: wait for the data its form needs, so it opens at its
 * final size instead of a skeleton that then grows. Gives up after 400 ms, so
 * a slow network still opens it (with the skeleton). Pass
 * `queryClient.query(cached(...))` calls.
 */
export const warmDialog = async (
  ...loads: Promise<unknown>[]
): Promise<void> => {
  await Promise.race([
    Promise.allSettled(loads),
    // A timer has no promise API in the browser.
    // oxlint-disable-next-line promise/avoid-new
    new Promise((resolve) => {
      setTimeout(resolve, DIALOG_WAIT_MS);
    }),
  ]);
};
