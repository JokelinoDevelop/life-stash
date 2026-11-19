import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { FormDialog } from "@/components/app/form-dialog";
import { Button } from "@/components/ui/button";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";

import { useInvalidateGarage } from "../cars/cars.queries";
import type { CatalogItem, CatalogPackage } from "./catalog.queries";
import {
  packageFormDefaults,
  packageFormToRequest,
} from "./forms/package-form/mapper";
import { PackageForm } from "./forms/package-form/package-form";

const DeletePackageButton = ({
  onDone,
  pkg,
}: {
  onDone: () => void;
  pkg: CatalogPackage;
}) => {
  const { t } = useTranslation("garageCatalog");
  const { t: tc } = useTranslation();
  const invalidate = useInvalidateGarage();
  const errorMessage = useErrorMessage();

  return (
    <ConfirmDialog
      description={t("packages.deleteDescription")}
      onConfirm={async () => {
        try {
          await unwrap(
            api.garage.packages[":packageId"].$delete({
              param: { packageId: pkg.id },
            })
          );
          await invalidate();
          toast.success(t("packages.deleted"));
          onDone();
        } catch (error) {
          toast.error(errorMessage(error));
          throw error;
        }
      }}
      title={t("packages.deleteTitle")}
      trigger={
        <Button
          aria-label={tc("actions.delete")}
          size="icon-compact"
          type="button"
          variant="ghost"
        >
          <Trash2 />
        </Button>
      }
    />
  );
};

/** Create a package, or edit / delete one. */
export const PackageDialog = ({
  items,
  onOpenChange,
  open,
  pkg,
}: {
  /** Active catalog items to pick from. */
  items: CatalogItem[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
  /** `null` creates a new package. */
  pkg: CatalogPackage | null;
}) => {
  const { t } = useTranslation("garageCatalog");
  const invalidate = useInvalidateGarage();
  const errorMessage = useErrorMessage();

  const close = () => {
    onOpenChange(false);
  };

  return (
    <FormDialog
      crumb={<span className="truncate">{t("title")}</span>}
      onOpenChange={onOpenChange}
      open={open}
      size="lg"
      title={pkg === null ? t("packages.createTitle") : t("packages.editTitle")}
    >
      <PackageForm
        defaultValues={packageFormDefaults(pkg ?? undefined)}
        footerStart={
          pkg === null ? undefined : (
            <DeletePackageButton onDone={close} pkg={pkg} />
          )
        }
        items={items}
        key={pkg?.id ?? "new"}
        onCancel={close}
        onSubmit={async (values) => {
          try {
            const json = packageFormToRequest(values);

            if (pkg === null) {
              await unwrap(api.garage.packages.$post({ json }));
              toast.success(t("packages.created"));
            } else {
              await unwrap(
                api.garage.packages[":packageId"].$put({
                  json,
                  param: { packageId: pkg.id },
                })
              );
              toast.success(t("packages.updated"));
            }

            await invalidate();
            close();
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
      />
    </FormDialog>
  );
};
