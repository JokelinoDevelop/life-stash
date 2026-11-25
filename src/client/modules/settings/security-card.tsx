import { useQuery } from "@tanstack/react-query";
import { KeyRound, LifeBuoy, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ResponsiveDialog } from "@/components/app/responsive-dialog";

import { CredentialsSheet } from "./credentials-sheet";
import { PasskeysSection } from "./passkeys-section";
import { LOW_CODES, RecoveryCodesSection } from "./recovery-codes-section";
import {
  RowValueSkeleton,
  SettingsActionRow,
  SettingsSection,
} from "./settings-section";
import {
  credentialsQuery,
  passkeysQuery,
  recoveryCodesQuery,
} from "./settings.queries";

type Sheet = "password" | "passkeys" | "recovery" | null;

/**
 * Sign-in & security: one row each for password, passkeys and recovery codes,
 * showing where things stand; the details open in a sheet.
 */
export const SecurityCard = () => {
  const { t } = useTranslation("settings");
  const credentials = useQuery(credentialsQuery);
  const passkeys = useQuery(passkeysQuery);
  const recovery = useQuery(recoveryCodesQuery);
  const [sheet, setSheet] = useState<Sheet>(null);

  const close = (open: boolean) => {
    if (!open) {
      setSheet(null);
    }
  };

  let passwordValue: React.ReactNode = <RowValueSkeleton />;

  if (credentials.data !== undefined) {
    passwordValue = credentials.data.hasPassword
      ? t("security.passwordSet")
      : t("security.passwordNotSet");
  }

  const remaining = recovery.data?.remaining;

  return (
    <SettingsSection flush title={t("security.title")}>
      <SettingsActionRow
        icon={<LockKeyhole />}
        label={t("security.password")}
        onClick={() => {
          setSheet("password");
        }}
        value={passwordValue}
      />
      <SettingsActionRow
        icon={<KeyRound />}
        label={t("security.passkeys")}
        onClick={() => {
          setSheet("passkeys");
        }}
        value={
          passkeys.data === undefined ? (
            <RowValueSkeleton />
          ) : (
            t("security.passkeyCount", { count: passkeys.data.passkeys.length })
          )
        }
      />
      <SettingsActionRow
        icon={<LifeBuoy />}
        label={t("security.recoveryCodes")}
        onClick={() => {
          setSheet("recovery");
        }}
        tone={
          remaining !== undefined && remaining <= LOW_CODES
            ? "warning"
            : "default"
        }
        value={
          remaining === undefined ? (
            <RowValueSkeleton />
          ) : (
            t("security.codesLeft", { count: remaining })
          )
        }
      />
      <CredentialsSheet onOpenChange={close} open={sheet === "password"} />
      <ResponsiveDialog
        onOpenChange={close}
        open={sheet === "passkeys"}
        title={t("security.passkeys")}
      >
        <PasskeysSection />
      </ResponsiveDialog>
      <ResponsiveDialog
        onOpenChange={close}
        open={sheet === "recovery"}
        title={t("security.recoveryCodes")}
      >
        <RecoveryCodesSection />
      </ResponsiveDialog>
    </SettingsSection>
  );
};
