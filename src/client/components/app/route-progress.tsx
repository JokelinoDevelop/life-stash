import { useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

/**
 * A thin bar along the top while a route loads. The current page stays on
 * screen; the bar only appears after 150 ms, so instant navigations show nothing.
 */
export const RouteProgress = () => {
  const { t } = useTranslation();

  const pending = useRouterState({
    select: (state) => state.status === "pending",
  });

  if (!pending) {
    return null;
  }

  return (
    <output
      aria-label={t("loading")}
      className="animate-reveal pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden md:absolute md:rounded-t-lg"
    >
      <span className="bg-primary animate-progress block h-full w-2/5" />
    </output>
  );
};
