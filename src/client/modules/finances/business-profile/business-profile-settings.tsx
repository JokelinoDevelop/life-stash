import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { ErrorState, LoadingState } from "@/components/app/states";
import { SettingsSection } from "@/modules/settings/settings-section";

import { businessProfileQuery } from "./business-profile.queries";
import { BusinessProfileForm } from "./forms/business-profile-form/business-profile-form";

/** Settings › Finances › Your details (printed on every invoice you issue). */
export const BusinessProfileSettings = () => {
  const { t } = useTranslation("finances");
  const profile = useQuery(businessProfileQuery);

  let body = <LoadingState rows={4} variant="rows" />;

  if (profile.isError) {
    body = (
      <ErrorState
        error={profile.error}
        onRetry={() => {
          void profile.refetch();
        }}
      />
    );
  } else if (profile.data !== undefined) {
    body = <BusinessProfileForm profile={profile.data.profile} />;
  }

  return (
    <SettingsSection
      description={t("profile.description")}
      title={t("profile.title")}
    >
      <div id="your-details">{body}</div>
    </SettingsSection>
  );
};
