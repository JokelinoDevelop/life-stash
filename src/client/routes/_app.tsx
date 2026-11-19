import { createFileRoute, redirect } from "@tanstack/react-router";

import { AppShell } from "@/components/app/app-shell";
import { setLocale } from "@/i18n";
import { authStatusQuery, preferencesQuery } from "@/lib/session";
import { entryDialogSearchSchema } from "@/modules/garage/entry-dialogs/entry-dialog-search";

export const Route = createFileRoute("/_app")({
  validateSearch: entryDialogSearchSchema,
  beforeLoad: async ({ context, location }) => {
    const status = await context.queryClient.query(authStatusQuery);

    if (status.setupRequired) {
      throw redirect({ to: "/setup" });
    }

    if (status.user === null) {
      throw redirect({ search: { redirect: location.href }, to: "/login" });
    }

    const preferences = await context.queryClient.query(preferencesQuery);

    if (document.documentElement.lang !== preferences.locale) {
      await setLocale(preferences.locale);
    }
  },
  component: AppShell,
});
