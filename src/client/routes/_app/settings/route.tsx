import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

import { HouseholdName } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { authStatusQuery, preferencesQuery } from "@/lib/session";
import { useSignOut } from "@/lib/use-sign-out";

/** Phones only, at the end of every Settings tab (desktop: the sidebar's account menu). */
const PhoneSignOut = () => {
  const { t } = useTranslation("auth");
  const handleSignOut = useSignOut();

  return (
    <div className="mt-8 md:hidden">
      <Button
        className="w-full"
        onClick={() => {
          void handleSignOut();
        }}
        size="submit"
        variant="destructive"
      >
        <LogOut />
        {t("signOut")}
      </Button>
    </div>
  );
};

const tabClass =
  "text-muted-foreground hover:text-foreground flex h-9 items-center rounded-md px-2.5 text-sm font-medium transition-colors md:h-7";

const activeTabClass = "bg-accent max-md:bg-card text-foreground";

/** Settings: General (account, preferences, security), one tab per module, and People (admins). */
const SettingsLayout = () => {
  const { t } = useTranslation("settings");
  const { t: tf } = useTranslation("finances");
  const status = useQuery(authStatusQuery);

  return (
    <>
      {/* Phones: the same top row as the other tabs, so the title doesn't jump. */}
      <PageHeader
        mobileTop={<HouseholdName className="-ml-1" />}
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
          to="/settings"
        >
          {tf("settings.general")}
        </Link>
        <Link
          activeProps={{ className: activeTabClass }}
          className={tabClass}
          to="/settings/finances"
        >
          {tf("settings.tab")}
        </Link>
        {status.data?.user?.isAdmin === true && (
          <Link
            activeProps={{ className: activeTabClass }}
            className={tabClass}
            to="/settings/users"
          >
            {t("users.tab")}
          </Link>
        )}
      </nav>
      <Outlet />
      <PhoneSignOut />
    </>
  );
};

export const Route = createFileRoute("/_app/settings")({
  component: SettingsLayout,
  loader: async ({ context }) => {
    await context.queryClient.query(preferencesQuery);
  },
});
