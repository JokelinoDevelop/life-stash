import { useQuery } from "@tanstack/react-query";
import { FileText, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useErrorMessage } from "@/lib/errors";
import { useListMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

import {
  MAX_PDF_BYTES,
  attachmentsQuery,
  useDeleteAttachment,
  useUploadAttachments,
} from "./attachments.queries";
import type { AttachmentOwner } from "./attachments.queries";
import { formatFileSize } from "./file-size";

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";

const FileRow = ({
  busy = false,
  contentType,
  href,
  name,
  note,
  onRemove,
  size,
}: {
  busy?: boolean;
  contentType: string;
  href?: string;
  name: string;
  /** A second line, e.g. "Generated when issued". */
  note?: string;
  onRemove?: () => void;
  size: number;
}) => {
  const { t } = useTranslation("finances");
  const pdf = contentType === "application/pdf";

  return (
    <li className="flex min-h-11 items-center gap-2.5 px-3 md:min-h-9">
      <span className="bg-muted text-subtle-foreground flex size-6 shrink-0 items-center justify-center rounded-sm border [&_svg]:size-3.5">
        {pdf ? <FileText /> : <ImageIcon />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        {href === undefined ? (
          <span className="truncate text-sm">{name}</span>
        ) : (
          <a
            className="hover:text-primary truncate text-sm font-medium"
            href={href}
            rel="noopener noreferrer"
            target="_blank"
          >
            {name}
          </a>
        )}
        {note !== undefined && (
          <span className="text-muted-foreground truncate text-xs">{note}</span>
        )}
      </span>
      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
        {busy ? t("invoices.files.uploading") : formatFileSize(size)}
      </span>
      {busy && (
        <Loader2
          aria-hidden="true"
          className="text-muted-foreground size-3.5 animate-spin"
        />
      )}
      {onRemove !== undefined && !busy && (
        <Button
          aria-label={t("invoices.files.remove", { name })}
          onClick={onRemove}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <X />
        </Button>
      )}
    </li>
  );
};

/** Drop zone + file picker; checks the 10 MB limit before anything is uploaded. */
const DropZone = ({
  disabled,
  onFiles,
}: {
  disabled: boolean;
  onFiles: (files: File[]) => void;
}) => {
  const { t } = useTranslation("finances");
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const accept = (files: File[]) => {
    const fitting = files.filter((file) => {
      if (file.size > MAX_PDF_BYTES) {
        toast.error(t("invoices.files.tooBig", { name: file.name }));

        return false;
      }

      return true;
    });

    if (fitting.length > 0) {
      onFiles(fitting);
    }
  };

  return (
    // Dropping files is a pointer shortcut; the file input inside is the keyboard path.
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <label
      className={cn(
        "text-muted-foreground flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 text-sm transition-colors",
        over && "border-primary bg-accent"
      )}
      onDragLeave={() => {
        setOver(false);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        accept([...event.dataTransfer.files]);
      }}
    >
      <Upload aria-hidden="true" className="size-4" />
      <span>
        {t("invoices.files.drop")}{" "}
        <span className="text-primary font-medium">
          {t("invoices.files.browse")}
        </span>
      </span>
      <input
        accept={ACCEPT}
        className="sr-only"
        disabled={disabled}
        multiple
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = "";
          accept(files);
        }}
        ref={input}
        type="file"
      />
    </label>
  );
};

/** Files of a saved invoice or transaction: open in a new tab, remove, add more. */
export const FileList = ({
  compact = false,
  owner,
}: {
  compact?: boolean;
  owner: AttachmentOwner;
}) => {
  const { t } = useTranslation("finances");
  const errorMessage = useErrorMessage();
  const files = useQuery(attachmentsQuery(owner));
  const upload = useUploadAttachments(owner);
  const remove = useDeleteAttachment();
  const [pending, setPending] = useState<File[]>([]);
  const rows = useListMotion();

  const onFiles = async (picked: File[]) => {
    setPending(picked);

    let failed: string[];

    try {
      failed = await upload.mutateAsync(picked);
    } catch (error) {
      toast.error(errorMessage(error));
      setPending([]);

      return;
    }

    setPending([]);

    for (const name of failed) {
      toast.error(t("invoices.files.uploadFailed", { name }));
    }

    if (failed.length < picked.length) {
      toast.success(t("invoices.files.uploaded"));
    }
  };

  const list = files.data?.photos ?? [];

  return (
    <div className="flex flex-col gap-2">
      {(list.length > 0 || pending.length > 0) && (
        <ul className="divide-divider divide-y rounded-md border" ref={rows}>
          {list.map((file) => (
            <FileRow
              contentType={file.contentType}
              href={file.url}
              key={file.id}
              name={file.fileName ?? file.id}
              note={file.generated ? t("invoices.files.generated") : undefined}
              onRemove={
                file.generated
                  ? undefined
                  : () => {
                      remove.mutate(file.id, {
                        onError: (error) => {
                          toast.error(errorMessage(error));
                        },
                        onSuccess: () => {
                          toast.success(t("invoices.files.removed"));
                        },
                      });
                    }
              }
              size={file.sizeBytes}
            />
          ))}
          {pending.map((file) => (
            <FileRow
              busy
              contentType={file.type}
              key={file.name}
              name={file.name}
              size={file.size}
            />
          ))}
        </ul>
      )}
      {!compact && (
        <DropZone
          disabled={upload.isPending}
          onFiles={(picked) => {
            void onFiles(picked);
          }}
        />
      )}
    </div>
  );
};

/** Files picked before the record exists; they upload right after it is saved. */
export const PendingFileList = ({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) => (
  <div className="flex flex-col gap-2">
    {files.length > 0 && (
      <ul className="divide-divider divide-y rounded-md border">
        {files.map((file) => (
          <FileRow
            contentType={file.type}
            key={file.name}
            name={file.name}
            onRemove={() => {
              onChange(files.filter((other) => other !== file));
            }}
            size={file.size}
          />
        ))}
      </ul>
    )}
    <DropZone
      disabled={false}
      onFiles={(picked) => {
        onChange([...files, ...picked]);
      }}
    />
  </div>
);
