import { Link, useNavigate } from "@tanstack/react-router";
import {
  Archive,
  ArchiveRestore,
  BellPlus,
  Fuel,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { DatePicker } from "@/components/form/date-picker";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { useErrorMessage } from "@/lib/errors";
import { CAR_SHORTCUTS } from "@/lib/shortcuts";

import { EntryDialogLink } from "../entry-dialogs/entry-dialog-link";
import { useArchiveCar, useDeleteCar, useUnarchiveCar } from "./cars.queries";

type Run = (action: () => Promise<void>, success: string) => Promise<void>;

const useRun = (): Run => {
  const errorMessage = useErrorMessage();

  return async (action, success) => {
    try {
      await action();
      toast.success(success);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };
};

/** Log service / expense / reminder and edit: the actions without a button of their own. */
const AddItems = ({ carId }: { carId: string }) => {
  const { t } = useTranslation("command");
  const { t: tc } = useTranslation();

  return (
    <>
      <DropdownMenuItem
        render={<EntryDialogLink entry={{ car: carId, dialog: "service" }} />}
      >
        <Wrench />
        {t("actions.addService")}
        <DropdownMenuShortcut>
          {CAR_SHORTCUTS.addService.toUpperCase()}
        </DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem
        render={<EntryDialogLink entry={{ car: carId, dialog: "expense" }} />}
      >
        <Fuel />
        {t("actions.addExpense")}
        <DropdownMenuShortcut>
          {CAR_SHORTCUTS.addExpense.toUpperCase()}
        </DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem
        render={<EntryDialogLink entry={{ car: carId, dialog: "reminder" }} />}
      >
        <BellPlus />
        {t("actions.addReminder")}
        <DropdownMenuShortcut>
          {CAR_SHORTCUTS.addReminder.toUpperCase()}
        </DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem
        className="md:hidden"
        render={<EntryDialogLink entry={{ car: carId, dialog: "car" }} />}
      >
        <Pencil />
        {tc("actions.edit")}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
    </>
  );
};

const ArchiveItem = ({ carId, run }: { carId: string; run: Run }) => {
  const { t } = useTranslation("garage");
  const archive = useArchiveCar(carId);
  const [soldDate, setSoldDate] = useState("");

  return (
    <ConfirmDialog
      confirmLabel={t("car.archive")}
      description={t("car.archiveDescription")}
      onConfirm={async () => {
        await run(async () => {
          await archive.mutateAsync(soldDate === "" ? null : soldDate);
        }, t("car.archivedToast"));
      }}
      title={t("car.archiveTitle")}
      trigger={
        <DropdownMenuItem closeOnClick={false}>
          <Archive />
          {t("car.archive")}
        </DropdownMenuItem>
      }
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="sold-date">{t("car.soldDate")}</Label>
        <DatePicker
          clearable
          id="sold-date"
          onChange={setSoldDate}
          placeholder={t("car.soldDatePlaceholder")}
          value={soldDate}
        />
      </div>
    </ConfirmDialog>
  );
};

const DeleteItem = ({ carId, run }: { carId: string; run: Run }) => {
  const { t } = useTranslation("garage");
  const { t: tc } = useTranslation();
  const navigate = useNavigate();
  const remove = useDeleteCar(carId);

  return (
    <ConfirmDialog
      description={t("car.deleteDescription")}
      onConfirm={async () => {
        await run(async () => {
          await remove.mutateAsync();
          await navigate({ to: "/garage" });
        }, t("car.deletedToast"));
      }}
      title={t("car.deleteTitle")}
      trigger={
        <DropdownMenuItem closeOnClick={false} variant="destructive">
          <Trash2 />
          {tc("actions.delete")}
        </DropdownMenuItem>
      }
    />
  );
};

const MoreMenu = ({
  car,
  run,
}: {
  car: { id: string; archivedAt: string | null };
  run: Run;
}) => {
  const { t: tc } = useTranslation();
  const active = car.archivedAt === null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={tc("actions.more")}
            size="icon-compact"
            variant="ghost"
          />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {active && <AddItems carId={car.id} />}
        {active && <ArchiveItem carId={car.id} run={run} />}
        <DeleteItem carId={car.id} run={run} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/** Page-bar actions on a car: Edit and Log entry (L), or Restore when archived, plus More. */
export const CarActions = ({
  car,
}: {
  car: { id: string; archivedAt: string | null };
}) => {
  const { t } = useTranslation("garage");
  const { t: tc } = useTranslation();
  const unarchive = useUnarchiveCar(car.id);
  const run = useRun();

  return (
    <div className="flex items-center gap-1 md:gap-1.5">
      {car.archivedAt === null ? (
        <>
          <span className="hidden md:flex">
            <Button
              size="compact"
              variant="ghost"
              render={
                <EntryDialogLink entry={{ car: car.id, dialog: "car" }} />
              }
              nativeButton={false}
            >
              {tc("actions.edit")}
            </Button>
          </span>
          <Button
            size="compact"
            render={
              <Link
                params={{ carId: car.id }}
                search={{ log: true, tab: "timeline" }}
                to="/garage/cars/$carId"
              />
            }
            nativeButton={false}
          >
            <Plus />
            <span className="md:hidden">{tc("actions.log")}</span>
            <span className="hidden md:inline">{tc("actions.logEntry")}</span>
            <Kbd className="hidden md:inline-flex">
              {CAR_SHORTCUTS.logOdometer.toUpperCase()}
            </Kbd>
          </Button>
        </>
      ) : (
        <Button
          onClick={async () => {
            await run(async () => {
              await unarchive.mutateAsync();
            }, t("car.restoredToast"));
          }}
          size="compact"
          variant="outline"
        >
          <ArchiveRestore />
          {t("car.unarchive")}
        </Button>
      )}
      <MoreMenu car={car} run={run} />
    </div>
  );
};
