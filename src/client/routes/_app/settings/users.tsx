import { createFileRoute, redirect } from "@tanstack/react-router";

import { PageContent } from "@/components/app/page-header";
import { authStatusQuery } from "@/lib/session";
import { UsersSettings } from "@/modules/settings/users/users-settings";

const UsersSettingsPage = () => (
  <PageContent>
    <div className="flex flex-col gap-6">
      <UsersSettings />
    </div>
  </PageContent>
);

export const Route = createFileRoute("/_app/settings/users")({
  beforeLoad: async ({ context }) => {
    const status = await context.queryClient.query(authStatusQuery);

    if (status.user?.isAdmin !== true) {
      throw redirect({ to: "/settings" });
    }
  },
  component: UsersSettingsPage,
});
