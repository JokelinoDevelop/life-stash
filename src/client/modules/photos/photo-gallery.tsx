import { useQuery } from "@tanstack/react-query";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useErrorMessage } from "@/lib/errors";
import { useConfig } from "@/lib/session";

import { photosQuery, useDeletePhoto, useUploadPhotos } from "./photos.queries";
import type { Photo, PhotoOwner } from "./photos.queries";

const UploadButton = ({ owner }: { owner: PhotoOwner }) => {
  const { t } = useTranslation("garageVisits");
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploadPhotos(owner);
  const errorMessage = useErrorMessage();

  const onFiles = async (files: File[]) => {
    try {
      const failed = await upload.mutateAsync(files);

      for (const name of failed) {
        toast.error(t("photos.failed", { name }));
      }

      if (failed.length < files.length) {
        toast.success(t("photos.uploaded"));
      }
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <>
      <input
        accept="image/*"
        className="hidden"
        multiple
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = "";

          if (files.length > 0) {
            void onFiles(files);
          }
        }}
        ref={input}
        type="file"
      />
      <Button
        disabled={upload.isPending}
        onClick={() => input.current?.click()}
        type="button"
        variant="outline"
      >
        {upload.isPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <ImagePlus />
        )}
        {upload.isPending ? t("photos.uploading") : t("photos.add")}
      </Button>
    </>
  );
};

/** Thumbnails of an owner's photos with full-size view, upload and delete. */
export const PhotoGallery = ({
  owner,
  readOnly,
}: {
  owner: PhotoOwner;
  readOnly: boolean;
}) => {
  const { t } = useTranslation("garageVisits");
  const config = useConfig();
  const photos = useQuery(photosQuery(owner));
  const remove = useDeletePhoto(owner);
  const errorMessage = useErrorMessage();
  const [viewing, setViewing] = useState<Photo | null>(null);
  const enabled = config.data?.photosEnabled === true;

  if (config.isSuccess && !enabled) {
    return (
      <p className="text-muted-foreground text-sm">{t("photos.disabled")}</p>
    );
  }

  const list = photos.data?.photos ?? [];

  return (
    <div className="flex flex-col gap-3">
      {photos.isSuccess && list.length === 0 && (
        <p className="text-muted-foreground text-sm">{t("photos.empty")}</p>
      )}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {list.map((photo) => (
          <div className="relative" key={photo.id}>
            <button
              aria-label={t("photos.title")}
              className="block aspect-square w-full overflow-hidden rounded-lg border"
              onClick={() => {
                setViewing(photo);
              }}
              type="button"
            >
              <img
                alt=""
                className="size-full object-cover"
                loading="lazy"
                src={photo.url}
              />
            </button>
            {!readOnly && (
              <div className="absolute top-1 right-1">
                <ConfirmDialog
                  onConfirm={async () => {
                    try {
                      await remove.mutateAsync(photo.id);
                      toast.success(t("photos.deleted"));
                    } catch (error) {
                      toast.error(errorMessage(error));
                    }
                  }}
                  trigger={
                    <Button
                      aria-label={t("photos.deleted")}
                      size="icon-sm"
                      variant="secondary"
                    >
                      <Trash2 />
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        ))}
      </div>
      {!readOnly && enabled && (
        <div>
          <UploadButton owner={owner} />
        </div>
      )}
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setViewing(null);
          }
        }}
        open={viewing !== null}
      >
        <DialogContent>
          <DialogTitle className="sr-only">{t("photos.title")}</DialogTitle>
          {viewing !== null && (
            <img
              alt=""
              className="max-h-[80dvh] w-full object-contain"
              src={viewing.url}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
