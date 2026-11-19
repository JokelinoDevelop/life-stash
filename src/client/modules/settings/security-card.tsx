import { useTranslation } from "react-i18next";

import { Separator } from "@/components/ui/separator";

import { CredentialsSection } from "./credentials-section";
import { PasskeysSection } from "./passkeys-section";
import { RecoveryCodesSection } from "./recovery-codes-section";
import { SettingsSection } from "./settings-section";

export const SecurityCard = () => {
  const { t } = useTranslation("settings");

  return (
    <SettingsSection title={t("security.title")}>
      <div className="flex flex-col gap-4">
        <CredentialsSection />
        <Separator />
        <PasskeysSection />
        <Separator />
        <RecoveryCodesSection />
      </div>
    </SettingsSection>
  );
};
