import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { api, unwrap } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

import { CredentialsForm } from "./credentials-form/credentials-form";

export const CredentialsSection = () => {
  const { t } = useTranslation("settings");

  const credentials = useQuery({
    queryFn: async () => await unwrap(api.account.credentials.$get()),
    queryKey: queryKeys.credentials,
  });

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{t("security.credentials")}</h3>
      <p className="text-muted-foreground text-sm">
        {t("security.credentialsHelp")}
      </p>
      {credentials.data?.hasPassword === false && (
        <Alert>
          <AlertDescription>{t("security.noPassword")}</AlertDescription>
        </Alert>
      )}
      {credentials.isSuccess && (
        <CredentialsForm
          credentials={credentials.data}
          key={credentials.dataUpdatedAt}
        />
      )}
    </div>
  );
};
