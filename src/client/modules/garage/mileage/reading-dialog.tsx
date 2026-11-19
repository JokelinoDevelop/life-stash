import { useQuery } from "@tanstack/react-query";
import { ChevronRight, X } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useIsDesktop } from "@/components/app/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";

import { CarMonogram } from "../cars/car-monogram";
import { carQuery, useInvalidateGarage } from "../cars/cars.queries";
import type { MileagePoint } from "./mileage.queries";
import {
  readingFormDefaults,
  readingFormToCreateRequest,
  readingFormToUpdateRequest,
  readingToFormValues,
} from "./reading-form/mapper";
import { ReadingForm } from "./reading-form/reading-form";
import type { ReadingFormValues } from "./reading-form/schema";

/** Desktop: car crumb › title, and a close button, as in the artifact. */
const DesktopShell = ({
  carName,
  children,
  description,
  onOpenChange,
  open,
  title,
}: {
  carName: string | undefined;
  children: ReactNode;
  description: string | undefined;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
}) => {
  const { t } = useTranslation();

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent showCloseButton={false} variant="bare">
        <div className="flex h-11 items-center justify-between pr-2 pl-4">
          <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
            {carName !== undefined && (
              <>
                <CarMonogram name={carName} size="sm" />
                <span className="truncate">{carName}</span>
                <ChevronRight aria-hidden="true" className="size-3 shrink-0" />
              </>
            )}
            <DialogTitle asChild>
              <span className="text-foreground truncate text-xs font-medium">
                {title}
              </span>
            </DialogTitle>
          </div>
          <DialogClose asChild>
            <Button
              aria-label={t("actions.close")}
              size="icon-compact"
              variant="ghost"
            >
              <X />
            </Button>
          </DialogClose>
        </div>
        <DialogDescription className="sr-only">
          {description ?? title}
        </DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
};

const MobileShell = ({
  children,
  description,
  onOpenChange,
  open,
  title,
}: {
  children: ReactNode;
  description: string | undefined;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
}) => (
  <Drawer onOpenChange={onOpenChange} open={open}>
    <DrawerContent>
      <DrawerHeader className="text-left">
        <DrawerTitle>{title}</DrawerTitle>
        <DrawerDescription className="sr-only">
          {description ?? title}
        </DrawerDescription>
      </DrawerHeader>
      <div className="max-h-[75dvh] overflow-y-auto pb-2">{children}</div>
    </DrawerContent>
  </Drawer>
);

/** Log a new reading (no `reading`) or edit a manual one — a bottom sheet on phones. */
export const ReadingDialog = ({
  carId,
  latest,
  onOpenChange,
  open,
  reading,
}: {
  carId: string;
  latest: { km: number; date: string } | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  reading: MileagePoint | null;
}) => {
  const { t } = useTranslation("garageMileage");
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidateGarage();
  const isDesktop = useIsDesktop();
  const car = useQuery(carQuery(carId));

  const save = async (values: ReadingFormValues) => {
    try {
      await (reading === null
        ? unwrap(
            api.garage.mileage.$post({
              json: readingFormToCreateRequest(values, {
                carId,
                unit: format.unit,
              }),
            })
          )
        : unwrap(
            api.garage.mileage[":readingId"].$put({
              json: readingFormToUpdateRequest(values, format.unit),
              param: { readingId: reading.id },
            })
          ));
      await invalidate();
      toast.success(t("saved"));
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const title = reading === null ? t("inline.dialogTitle") : t("editTitle");
  const description = reading === null ? t("logDescription") : undefined;

  const form = open && (
    <ReadingForm
      defaultValues={
        reading === null
          ? readingFormDefaults(todayIso())
          : readingToFormValues(reading, format.unit)
      }
      latest={reading === null ? latest : null}
      onCancel={() => {
        onOpenChange(false);
      }}
      onSubmit={save}
    />
  );

  return isDesktop ? (
    <DesktopShell
      carName={car.data?.car.name}
      description={description}
      onOpenChange={onOpenChange}
      open={open}
      title={title}
    >
      {form}
    </DesktopShell>
  ) : (
    <MobileShell
      description={description}
      onOpenChange={onOpenChange}
      open={open}
      title={title}
    >
      {form}
    </MobileShell>
  );
};
