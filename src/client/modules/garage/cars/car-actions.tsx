import { Link, useNavigate } from "@tanstack/react-router";
import {
  Archive,
  ArchiveRestore,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useErrorMessage } from "@/lib/errors";

import { useArchiveCar, useDeleteCar, useUnarchiveCar } from "./cars.queries";

export const CarActions = ({
  car,
}: {
  car: { id: string; archivedAt: string | null };
}) => {
  const { t } = useTranslation("garage");
  const { t: tc } = useTranslation();
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const archive = useArchiveCar(car.id);
  const unarchive = useUnarchiveCar(car.id);
  const remove = useDeleteCar(car.id);
  const [soldDate, setSoldDate] = useState("");

  const run = async (action: () => Promise<void>, success: string) => {
    try {
      await action();
      toast.success(success);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="flex gap-2">
      {car.archivedAt === null ? (
        <Button asChild variant="outline">
          <Link params={{ carId: car.id }} to="/garage/cars/$carId/edit">
            <Pencil />
            {tc("actions.edit")}
          </Link>
        </Button>
      ) : (
        <Button
          onClick={async () => {
            await run(async () => {
              await unarchive.mutateAsync();
            }, t("car.restoredToast"));
          }}
          variant="outline"
        >
          <ArchiveRestore />
          {t("car.unarchive")}
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label={tc("actions.edit")} size="icon" variant="outline">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {car.archivedAt === null && (
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
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                  }}
                >
                  <Archive />
                  {t("car.archive")}
                </DropdownMenuItem>
              }
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="sold-date">{t("car.soldDate")}</Label>
                <Input
                  id="sold-date"
                  onChange={(event) => {
                    setSoldDate(event.target.value);
                  }}
                  type="date"
                  value={soldDate}
                />
              </div>
            </ConfirmDialog>
          )}
          <DropdownMenuSeparator />
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
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                }}
                variant="destructive"
              >
                <Trash2 />
                {tc("actions.delete")}
              </DropdownMenuItem>
            }
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
