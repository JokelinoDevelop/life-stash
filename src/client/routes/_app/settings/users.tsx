import { createFileRoute, redirect } from "@tanstack/react-router";

import { PageContent } from "@/components/app/page-header";
import { authStatusQuery } from "@/lib/session";
import { cached, warm } from "@/lib/warm";
import { UsersSettings } from "@/modules/settings/users/users-settings";
import {
  adminInvitesQuery,
  adminUsersQuery,
} from "@/modules/settings/users/users.queries";

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
  loader: async ({ context: { queryClient } }) => {
    await warm(
      queryClient.query(cached(adminUsersQuery)),
      queryClient.query(cached(adminInvitesQuery))
    );
  },
  component: UsersSettingsPage,
});
