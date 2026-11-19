import { useQueryClient } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { api, unwrap } from "@/lib/api";
import { preferencesQuery } from "@/lib/session";

const tabClass =
  "text-muted-foreground hover:text-foreground flex h-9 items-center rounded-md px-2.5 text-sm font-medium transition-colors md:h-7";

const activeTabClass = "bg-accent text-foreground";

/** Settings: General (account, preferences, security) and one tab per module. */
const SettingsLayout = () => {
  const { t } = useTranslation("settings");
  const { t: ta } = useTranslation("auth");
  const { t: tf } = useTranslation("finances");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        actions={
          <Button
            onClick={async () => {
              await unwrap(api.auth.logout.$post());
              queryClient.clear();
              await navigate({ to: "/login" });
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
