import { useQuery } from "@tanstack/react-query";
import { Archive, ArchiveRestore, Pencil } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ResponsiveDialog } from "@/components/app/responsive-dialog";
import { ErrorState, LoadingState } from "@/components/app/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";

import { useInvalidateGarage } from "../cars/cars.queries";
import { catalogItemsQuery } from "./catalog.queries";
import type { CatalogItem } from "./catalog.queries";
import { ItemForm } from "./forms/item-form/item-form";
import { itemFormDefaults, itemFormToRequest } from "./forms/item-form/mapper";

const ItemRow = ({
  item,
  onRename,
}: {
  item: CatalogItem;
  onRename: () => void;
}) => {
  const { t } = useTranslation("garageCatalog");
  const invalidate = useInvalidateGarage();
  const errorMessage = useErrorMessage();
  const archived = item.archivedAt !== null;

  const toggleArchive = async () => {
    try {
      await unwrap(
        api.garage.items[":itemId"].archive.$post({
          json: { archived: !archived },
          param: { itemId: item.id },
        })
      );
      await invalidate();
      toast.success(
        archived ? t("items.restoredToast") : t("items.archivedToast")
      );
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <li className="flex items-center gap-2 py-2">
      <span className="min-w-0 flex-1 truncate">{item.name}</span>
      {archived && <Badge variant="secondary">{t("items.archived")}</Badge>}
      <Button
        aria-label={t("items.rename")}
        onClick={onRename}
        size="icon"
        variant="ghost"
      >
        <Pencil />
      </Button>
      <Button
        aria-label={archived ? t("items.restore") : t("items.archive")}
        onClick={toggleArchive}
        size="icon"
        variant="ghost"
      >
        {archived ? <ArchiveRestore /> : <Archive />}
      </Button>
    </li>
  );
};

export const ItemsSection = () => {
  const { t } = useTranslation("garageCatalog");
  const [showArchived, setShowArchived] = useState(false);
  const [renaming, setRenaming] = useState<CatalogItem | null>(null);
  const items = useQuery(catalogItemsQuery(showArchived));
  const invalidate = useInvalidateGarage();
  const errorMessage = useErrorMessage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("items.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <ItemForm
            defaultValues={itemFormDefaults()}
            onSubmit={async (values) => {
              try {
                await unwrap(
                  api.garage.items.$post({ json: itemFormToRequest(values) })
                );
                await invalidate();
                toast.success(t("items.created"));
              } catch (error) {
                toast.error(errorMessage(error));
              }
            }}
            submitLabel={t("items.add")}
          />
          {items.isPending && <LoadingState rows={2} />}
          {items.isError && <ErrorState error={items.error} />}
          {items.isSuccess && items.data.items.length === 0 && (
            <p className="text-muted-foreground text-sm">{t("items.empty")}</p>
          )}
          {items.isSuccess && (
            <ul className="flex flex-col divide-y">
              {items.data.items.map((item) => (
                <ItemRow
                  item={item}
                  key={item.id}
                  onRename={() => {
                    setRenaming(item);
                  }}
                />
              ))}
            </ul>
          )}
          <div className="flex items-center gap-2">
            <Switch
              checked={showArchived}
              id="show-archived-items"
              onCheckedChange={setShowArchived}
            />
            <Label htmlFor="show-archived-items">
              {t("items.showArchived")}
            </Label>
          </div>
        </div>
      </CardContent>
      <ResponsiveDialog
        onOpenChange={(open) => {
          if (!open) {
            setRenaming(null);
          }
        }}
        open={renaming !== null}
        title={t("items.editTitle")}
      >
        {renaming !== null && (
          <ItemForm
            defaultValues={itemFormDefaults(renaming.name)}
            onSubmit={async (values) => {
              try {
                await unwrap(
                  api.garage.items[":itemId"].$put({
                    json: itemFormToRequest(values),
                    param: { itemId: renaming.id },
                  })
                );
                await invalidate();
                toast.success(t("items.renamed"));
                setRenaming(null);
              } catch (error) {
                toast.error(errorMessage(error));
              }
            }}
          />
        )}
      </ResponsiveDialog>
    </Card>
  );
};
