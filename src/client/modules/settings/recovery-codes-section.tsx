import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import { RecoveryCodesPanel } from "@/modules/auth/recovery-codes-panel";

const LOW_CODES = 3;

export const RecoveryCodesSection = () => {
  const { t } = useTranslation("settings");
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();
  const [codes, setCodes] = useState<string[] | null>(null);

  const remaining = useQuery({
    queryFn: async () => await unwrap(api.account["recovery-codes"].$get()),
    queryKey: queryKeys.recoveryCodes,
  });

  const regenerateLabel = t("security.regenerate");

  const regenerate = async () => {
    try {
      const result = await unwrap(api.account["recovery-codes"].$post());
      setCodes(result.recoveryCodes);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.recoveryCodes,
      });
    } catch (error) {
      toast.error(errorMessage(error));
      throw error;
    }
  };

  const remainingCount = remaining.data?.remaining ?? 0;

  if (codes !== null) {
    return (
      <RecoveryCodesPanel
        codes={codes}
        onDone={() => {
          setCodes(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{t("security.recoveryCodes")}</h3>
      <p className="text-muted-foreground text-sm">
        {t("security.remaining", { count: remainingCount })}
      </p>
      {remaining.isSuccess && remainingCount <= LOW_CODES && (
        <Alert>
          <AlertDescription>{t("security.lowCodes")}</AlertDescription>
        </Alert>
      )}
      <ConfirmDialog
        confirmLabel={regenerateLabel}
        description={t("security.regenerateConfirm")}
        onConfirm={regenerate}
        title={regenerateLabel}
        trigger={
          <Button className="self-start" variant="outline">
            <RefreshCw />
            {regenerateLabel}
          </Button>
        }
      />
    </div>
  );
};
