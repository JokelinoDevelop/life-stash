import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import type { AnyRouter } from "@tanstack/react-router";
import { RouterProvider } from "@tanstack/react-router";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ThemeProvider } from "./theme";
import { UpdatePrompt } from "./update-prompt";

export const App = ({
  queryClient,
  router,
}: {
  queryClient: QueryClient;
  router: AnyRouter;
}) => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster position="top-center" richColors />
        <UpdatePrompt />
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);
