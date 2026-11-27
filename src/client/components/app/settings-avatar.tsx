import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { usePreferences } from "@/lib/session";

/** Phones: your initial in the top row of a module home; opens Settings (it has no tab). */
export const SettingsAvatar = () => {
  const { t } = useTranslation();
  const preferences = usePreferences();
  const name = preferences.data?.displayName ?? "";

  return (
    <Link
      aria-label={t("nav.settings")}
      className="flex size-11 shrink-0 items-center justify-center rounded-full active:opacity-70"
      to="/settings"
    >
      <span className="bg-foreground text-background flex size-7.5 items-center justify-center rounded-full text-xs font-semibold">
        {name.slice(0, 1).toLocaleUpperCase()}
      </span>
    </Link>
  );
};
