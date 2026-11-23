import { useQuery } from "@tanstack/react-query";
import { Camera, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfig } from "@/lib/session";
import {
  photosQuery,
  useDeletePhoto,
  useUploadPhotos,
} from "@/modules/photos/photos.queries";

import { carTint } from "./car-tint";

interface HeroCar {
  id: string;
  make: string | null;
  model: string | null;
  name: string;
  plate: string | null;
  year: number | null;
}

/** Add, change or remove the car's photo (the newest one is shown). */
const PhotoButton = ({
  carId,
  photoId,
}: {
  carId: string;
  photoId: string | null;
}) => {
  const { t } = useTranslation("garage");
  const owner = { ownerId: carId, ownerType: "car" } as const;
  const upload = useUploadPhotos(owner);
  const remove = useDeletePhoto(owner);
  const input = useRef<HTMLInputElement>(null);

  const pick = () => {
    input.current?.click();
  };

  const icon = upload.isPending ? (
    <Loader2 className="animate-spin" />
  ) : (
    <Camera />
  );

  return (
    <>
      <input
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={async (event) => {
          const files = [...(event.target.files ?? [])].slice(0, 1);
          event.target.value = "";

          if (files.length === 0) {
            return;
          }

          const failed = await upload.mutateAsync(files);

          if (failed.length > 0) {
            toast.error(t("car.photo.failed"));
          } else {
            toast.success(t("car.photo.added"));
          }
        }}
        ref={input}
        type="file"
      />
      {photoId === null ? (
        <Button
          aria-label={t("car.photo.add")}
          disabled={upload.isPending}
          onClick={pick}
          size="icon-compact"
          variant="glass"
        >
          {icon}
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label={t("car.photo.menu")}
                disabled={upload.isPending}
                size="icon-compact"
                variant="glass"
              />
            }
          >
            {icon}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={pick}>
              <ImagePlus />
              {t("car.photo.change")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                await remove.mutateAsync(photoId);
                toast.success(t("car.photo.removed"));
              }}
              variant="destructive"
            >
              <Trash2 />
              {t("car.photo.remove")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
};

/**
 * Phones: the car's photo (or a gradient in its own tint, with its initials
 * as a watermark) under its name and plate. As the page scrolls the picture
 * drifts and the hero fades under the top bar, where the name reappears.
 */
export const CarHero = ({
  car,
  readOnly,
}: {
  car: HeroCar;
  readOnly: boolean;
}) => {
  const config = useConfig();
  const photosEnabled = config.data?.photosEnabled === true;

  const photos = useQuery({
    ...photosQuery({ ownerId: car.id, ownerType: "car" }),
    enabled: photosEnabled,
  });

  const photo = photos.data?.photos.at(-1) ?? null;

  const model = [car.year, car.make, car.model]
    .filter((part) => part !== null)
    .join(" ");

  const subtitle = [model, car.plate]
    .filter((part) => part !== null && part !== "")
    .join(" · ");

  const initials = car.name
    .split(/\s+/u)
    .filter((word) => word !== "")
    .slice(0, 2)
    .map((word) => word.slice(0, 1).toLocaleUpperCase())
    .join("");

  return (
    <section
      className="relative isolate -mt-1 h-48 overflow-hidden rounded-2xl text-white md:hidden"
      style={{ "--hero": `var(--tint-${carTint(car.name)})` }}
    >
      <div className="car-hero-media absolute inset-0 -z-10">
        {photo === null ? (
          <div className="car-hero-gradient flex size-full items-start justify-end overflow-hidden">
            <span
              aria-hidden="true"
              className="-mt-6 -mr-2 text-9xl font-bold tracking-tighter opacity-15"
            >
              {initials}
            </span>
          </div>
        ) : (
          <img alt="" className="size-full object-cover" src={photo.url} />
        )}
        <div className="car-hero-scrim absolute inset-0" />
      </div>
      {!readOnly && photosEnabled && (
        <div className="absolute top-2 right-2">
          <PhotoButton carId={car.id} photoId={photo?.id ?? null} />
        </div>
      )}
      <div className="car-hero-text absolute inset-x-4 bottom-4">
        <p className="truncate text-2xl font-semibold tracking-tight">
          {car.name}
        </p>
        {subtitle !== "" && (
          <p className="truncate text-sm tabular-nums opacity-85">{subtitle}</p>
        )}
      </div>
    </section>
  );
};
