import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { markTabSwitch } from "@/lib/nav-transition";
import { authStatusQuery, preferencesQuery } from "@/lib/session";
import { useSignOut } from "@/lib/use-sign-out";

const tabClass =
  "text-muted-foreground hover:text-foreground flex h-9 items-center rounded-md px-2.5 text-sm font-medium transition-colors md:h-7";

const activeTabClass = "bg-accent text-foreground";

/** Settings: General (account, preferences, security), one tab per module, and People (admins). */
const SettingsLayout = () => {
  const { t } = useTranslation("settings");
  const { t: ta } = useTranslation("auth");
  const { t: tf } = useTranslation("finances");
  // Phones only: on desktop, Log out lives in the sidebar's account menu.
  const handleSignOut = useSignOut();
  const status = useQuery(authStatusQuery);

  return (
    <>
      <PageHeader
        actions={
          <Button
            className="md:hidden"
            onClick={() => {
              void handleSignOut();
            }}
            size="compact"
            variant="outline"
          >
            <LogOut />
            {ta("signOut")}
          </Button>
        }
        title={t("title")}
      />
      <nav
        aria-label={t("title")}
        className="md:border-divider mb-4 flex gap-1 md:mb-0 md:border-b md:px-5 md:py-2"
      >
        <Link
          activeOptions={{ exact: true }}
          activeProps={{ className: activeTabClass }}
          className={tabClass}
          onClick={markTabSwitch}
          to="/settings"
        >
          {tf("settings.general")}
        </Link>
        <Link
          activeProps={{ className: activeTabClass }}
          className={tabClass}
          onClick={markTabSwitch}
          to="/settings/finances"
        >
          {tf("settings.tab")}
        </Link>
        {status.data?.user?.isAdmin === true && (
          <Link
            activeProps={{ className: activeTabClass }}
            className={tabClass}
            onClick={markTabSwitch}
            to="/settings/users"
          >
            {t("users.tab")}
          </Link>
        )}
      </nav>
      <Outlet />
    </>
  );
};

export const Route = createFileRoute("/_app/settings")({
  component: SettingsLayout,
  loader: async ({ context }) => {
    await context.queryClient.query(preferencesQuery);
  },
});
