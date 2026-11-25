import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ResponsiveDialog } from "@/components/app/responsive-dialog";
import { ErrorState, LoadingState } from "@/components/app/states";
import {
  SettingsActionRow,
  SettingsSection,
} from "@/modules/settings/settings-section";

import { businessProfileQuery } from "./business-profile.queries";
import { BusinessProfileForm } from "./forms/business-profile-form/business-profile-form";
import { businessProfileToFormValues } from "./forms/business-profile-form/mapper";
import { ProfileHeaderPreview } from "./profile-header-preview";

/** The anchor invoice screens link to when your details are missing; it opens the editor. */
const ANCHOR = "your-details";

/**
 * Settings › Finances › Your details (printed on every invoice you issue):
 * the invoice header as it prints, and Edit, which opens the form in a sheet.
 */
export const BusinessProfileSettings = () => {
  const { t } = useTranslation("finances");
  const profile = useQuery(businessProfileQuery);
  const hash = useRouterState({ select: (state) => state.location.hash });
  const [editing, setEditing] = useState(hash === ANCHOR);

  let body = <LoadingState rows={2} variant="rows" />;

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
    body = (
      <>
        <div className="p-4">
          <ProfileHeaderPreview
            values={businessProfileToFormValues(profile.data.profile)}
          />
        </div>
        <SettingsActionRow
          icon={<Pencil />}
          label={t("profile.edit")}
          onClick={() => {
            setEditing(true);
          }}
        />
        <ResponsiveDialog
          description={t("profile.description")}
          onOpenChange={setEditing}
          open={editing}
          title={t("profile.title")}
        >
          <BusinessProfileForm
            onSaved={() => {
              setEditing(false);
            }}
            profile={profile.data.profile}
          />
        </ResponsiveDialog>
      </>
    );
  }

  return (
    <div className="scroll-mt-4" id={ANCHOR}>
      <SettingsSection
        description={t("profile.description")}
        flush
        title={t("profile.title")}
      >
        {body}
      </SettingsSection>
    </div>
  );
};
