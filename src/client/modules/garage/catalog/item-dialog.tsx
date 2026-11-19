import { Archive, ArchiveRestore } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { FormDialog } from "@/components/app/form-dialog";
import { FormNotice } from "@/components/form/dialog-form";
import { Button } from "@/components/ui/button";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";

import { useInvalidateGarage } from "../cars/cars.queries";
import type { CatalogItem } from "./catalog.queries";
import { ItemForm } from "./forms/item-form/item-form";
import { itemFormDefaults, itemFormToRequest } from "./forms/item-form/mapper";

/** Archive or restore from the edit dialog's footer. */
const ArchiveButton = ({
  item,
  onDone,
}: {
  item: CatalogItem;
  onDone: () => void;
}) => {
  const { t } = useTranslation("garageCatalog");
  const invalidate = useInvalidateGarage();
  const errorMessage = useErrorMessage();
  const [busy, setBusy] = useState(false);
  const archived = item.archivedAt !== null;

  return (
    <Button
      disabled={busy}
      onClick={async () => {
        setBusy(true);

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
          setBusy(false);
          onDone();
        } catch (error) {
          setBusy(false);
          toast.error(errorMessage(error));
        }
      }}
      size="compact"
      type="button"
      variant="ghost"
    >
      {archived ? <ArchiveRestore /> : <Archive />}
      {archived ? t("items.restore") : t("items.archive")}
    </Button>
  );
};

/** Create an item, or rename / archive / restore one. */
export const ItemDialog = ({
  item,
  onOpenChange,
  open,
}: {
  /** `null` creates a new item. */
  item: CatalogItem | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
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
      title={item === null ? t("items.createTitle") : t("items.editTitle")}
    >
      <ItemForm
        defaultValues={itemFormDefaults(item?.name)}
        footerStart={
          item === null ? undefined : (
            <ArchiveButton item={item} onDone={close} />
          )
        }
        key={item?.id ?? "new"}
        notice={
          item?.archivedAt === null || item === null ? undefined : (
            <FormNotice icon={<Archive />}>{t("items.archiveHint")}</FormNotice>
          )
        }
        onCancel={close}
        onSubmit={async (values) => {
          try {
            const json = itemFormToRequest(values);

            if (item === null) {
              await unwrap(api.garage.items.$post({ json }));
              toast.success(t("items.created"));
            } else {
              await unwrap(
                api.garage.items[":itemId"].$put({
                  json,
                  param: { itemId: item.id },
                })
              );
              toast.success(t("items.renamed"));
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
