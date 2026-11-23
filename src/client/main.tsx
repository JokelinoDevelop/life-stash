import "./styles.css";
import "./i18n";
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app/app";
import { applyDensity, readDensity } from "./app/density";
import { RouteError } from "./components/app/route-error";
import { RoutePending } from "./components/app/route-pending";
import { ApiClientError } from "./lib/api";
import {
  listenForBrowserTransitions,
  navTransitionTypes,
} from "./lib/nav-transition";
import { routeTree } from "./routeTree.gen";

applyDensity(readDensity());

listenForBrowserTransitions();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) =>
        !(
          error instanceof ApiClientError &&
          error.status >= 400 &&
          error.status < 500
        ) && failureCount < 2,
      staleTime: 30_000,
    },
  },
});

const router = createRouter({
  context: { queryClient },
  defaultErrorComponent: RouteError,
  // Keep the current page up while the next loads (with the top progress bar);
  // only a slow load swaps in the pending view.
  defaultPendingComponent: RoutePending,
  defaultPendingMinMs: 300,
  defaultPendingMs: 800,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  // Phones: screens slide in and out like a native stack (see styles.css).
  defaultViewTransition: { types: navTransitionTypes },
  scrollRestoration: true,
  routeTree,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const root = document.querySelector("#root");

if (root) {
  createRoot(root).render(
    <StrictMode>
      <App queryClient={queryClient} router={router} />
    </StrictMode>
  );
}
