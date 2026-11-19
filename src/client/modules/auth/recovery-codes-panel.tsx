import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";

/** Shows freshly issued recovery codes once, with copy and download helpers. */
export const RecoveryCodesPanel = ({
  codes,
  onDone,
}: {
  codes: string[];
  onDone: () => void;
}) => {
  const { t } = useTranslation("auth");
  const [copied, setCopied] = useState(false);
  const text = codes.join("\n");

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertTitle>{t("codes.title")}</AlertTitle>
        <AlertDescription>{t("codes.description")}</AlertDescription>
      </Alert>
      <ol className="bg-muted grid grid-cols-2 gap-2 rounded-lg p-4 font-mono text-sm">
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ol>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
          }}
          type="button"
          variant="outline"
        >
          {copied ? <Check /> : <Copy />}
          {copied ? t("codes.copied") : t("codes.copy")}
        </Button>
        <a
          className={buttonVariants({
            className: "flex-1",
            variant: "outline",
          })}
          download="lifestash-recovery-codes.txt"
          href={`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`}
        >
          <Download />
          {t("codes.download")}
        </a>
      </div>
      <Button onClick={onDone} type="button">
        {t("codes.confirm")}
      </Button>
    </div>
  );
};
