import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { PasskeysSection } from "./passkeys-section";
import { RecoveryCodesSection } from "./recovery-codes-section";

export const SecurityCard = () => {
  const { t } = useTranslation("settings");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("security.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <PasskeysSection />
          <Separator />
          <RecoveryCodesSection />
        </div>
      </CardContent>
    </Card>
  );
};
