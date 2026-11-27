import { Paperclip, X } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { MAX_PDF_BYTES } from "./attachments.queries";

/** "Receipt" chip for a new entry: picks photos / PDFs that upload once it's saved. */
export const ReceiptChip = ({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) => {
  const { t } = useTranslation("finances");
  const input = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        accept="application/pdf,image/jpeg,image/png,image/webp"
        className="sr-only"
        multiple
        onChange={(event) => {
          const picked = [...(event.target.files ?? [])].filter((file) => {
            if (file.size > MAX_PDF_BYTES) {
              toast.error(t("invoices.files.tooBig", { name: file.name }));

              return false;
            }

            return true;
          });

          event.target.value = "";
          onChange([...files, ...picked]);
        }}
        ref={input}
        tabIndex={-1}
        type="file"
      />
      <Button
        data-empty={files.length === 0}
        onClick={() => input.current?.click()}
        size="chip"
        type="button"
        variant="field"
      >
        <Paperclip />
        {files.length === 0
          ? t("receipts.add")
          : t("receipts.files", { count: files.length })}
      </Button>
      {files.length > 0 && (
        <Button
          aria-label={t("invoices.files.remove", {
            name: files.map((file) => file.name).join(", "),
          })}
          onClick={() => {
            onChange([]);
          }}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <X />
        </Button>
      )}
    </>
  );
};
