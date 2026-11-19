import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { Panel } from "@/components/app/list-section";
import { ResponsiveDialog } from "@/components/app/responsive-dialog";
import { ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";

import { useInvalidateGarage } from "../cars/cars.queries";
import { catalogItemsQuery, catalogPackagesQuery } from "./catalog.queries";
import type { CatalogPackage } from "./catalog.queries";
import {
  packageFormDefaults,
  packageFormToRequest,
} from "./forms/package-form/mapper";
import { PackageForm } from "./forms/package-form/package-form";
import type { PackageFormValues } from "./forms/package-form/schema";

const PackageRow = ({
  pkg,
  names,
  onEdit,
  onDelete,
}: {
  pkg: CatalogPackage;
  names: Map<string, string>;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}) => {
  const { t } = useTranslation("garageCatalog");

  const labels = pkg.itemIds.flatMap((id) => {
    const name = names.get(id);

    return name === undefined ? [] : [name];
  });

  return (
    <li className="flex items-start gap-2 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{pkg.name}</p>
        <p className="text-muted-foreground text-sm">
          {labels.length === 0
            ? t("packages.itemCount", { count: 0 })
            : labels.join(", ")}
        </p>
      </div>
      <Button
        aria-label={t("packages.editTitle")}
        onClick={onEdit}
        size="icon-compact"
        variant="ghost"
      >
        <Pencil />
      </Button>
      <ConfirmDialog
        onConfirm={onDelete}
        trigger={
          <Button
            aria-label={t("packages.deleted")}
            size="icon-compact"
            variant="ghost"
          >
            <Trash2 />
          </Button>
        }
      />
    </li>
  );
};

type Editing =
  | { mode: "create" }
  | { mode: "edit"; pkg: CatalogPackage }
  | null;

export const PackagesSection = () => {
  const { t } = useTranslation("garageCatalog");
  const packages = useQuery(catalogPackagesQuery);
  const items = useQuery(catalogItemsQuery(true));
  const invalidate = useInvalidateGarage();
  const errorMessage = useErrorMessage();
  const [editing, setEditing] = useState<Editing>(null);

  const names = new Map(
    (items.data?.items ?? []).map((item) => [item.id, item.name])
  );

  const activeItems = (items.data?.items ?? []).filter(
    (item) => item.archivedAt === null
  );

  const save = async (values: PackageFormValues) => {
    if (editing === null) {
      return;
    }

    try {
      const json = packageFormToRequest(values);

      if (editing.mode === "create") {
        await unwrap(api.garage.packages.$post({ json }));
        toast.success(t("packages.created"));
      } else {
        await unwrap(
          api.garage.packages[":packageId"].$put({
            json,
            param: { packageId: editing.pkg.id },
          })
        );
        toast.success(t("packages.updated"));
      }

      await invalidate();
      setEditing(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const remove = async (pkg: CatalogPackage) => {
    try {
      await unwrap(
        api.garage.packages[":packageId"].$delete({
          param: { packageId: pkg.id },
        })
      );
      await invalidate();
      toast.success(t("packages.deleted"));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <>
      <Panel
        action={
          <Button
            onClick={() => {
              setEditing({ mode: "create" });
            }}
            size="compact"
            variant="ghost"
          >
            <Plus />
            {t("packages.add")}
          </Button>
        }
        className="py-1"
        title={t("packages.title")}
      >
        {packages.isPending && <LoadingState rows={2} />}
        {packages.isError && <ErrorState error={packages.error} />}
        {packages.isSuccess && packages.data.packages.length === 0 && (
          <p className="text-muted-foreground py-3 text-sm">
            {t("packages.empty")}
          </p>
        )}
        {packages.isSuccess && (
          <ul className="divide-divider flex flex-col divide-y">
            {packages.data.packages.map((pkg) => (
              <PackageRow
                key={pkg.id}
                names={names}
                onDelete={async () => {
                  await remove(pkg);
                }}
                onEdit={() => {
                  setEditing({ mode: "edit", pkg });
                }}
                pkg={pkg}
              />
            ))}
          </ul>
        )}
      </Panel>
      <ResponsiveDialog
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
        open={editing !== null}
        title={
          editing?.mode === "edit"
            ? t("packages.editTitle")
            : t("packages.createTitle")
        }
      >
        {editing !== null && (
          <PackageForm
            defaultValues={packageFormDefaults(
              editing.mode === "edit" ? editing.pkg : undefined
            )}
            items={activeItems}
            onSubmit={save}
          />
        )}
      </ResponsiveDialog>
    </>
  );
};
