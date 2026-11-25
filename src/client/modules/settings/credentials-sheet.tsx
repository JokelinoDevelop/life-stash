import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { ResponsiveDialog } from "@/components/app/responsive-dialog";
import { FormSkeleton } from "@/components/app/states";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { CredentialsForm } from "./credentials-form/credentials-form";
import { credentialsQuery } from "./settings.queries";

/** Email & password in a sheet (a dialog on desktop): opened from the Email or Password row. */
export const CredentialsSheet = ({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) => {
  const { t } = useTranslation("settings");
  const credentials = useQuery(credentialsQuery);

  return (
    <ResponsiveDialog
      description={t("security.credentialsHelp")}
      onOpenChange={onOpenChange}
      open={open}
      title={t("security.credentials")}
    >
      {credentials.data === undefined ? (
        <FormSkeleton fields={3} />
      ) : (
        <div className="flex flex-col gap-4">
          {!credentials.data.hasPassword && (
            <Alert>
              <AlertDescription>{t("security.noPassword")}</AlertDescription>
            </Alert>
          )}
          <CredentialsForm
            credentials={credentials.data}
            key={credentials.dataUpdatedAt}
            onSaved={() => {
              onOpenChange(false);
            }}
          />
        </div>
      )}
    </ResponsiveDialog>
  );
};
