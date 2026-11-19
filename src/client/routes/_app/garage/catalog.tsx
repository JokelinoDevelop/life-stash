import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Boxes, Plus, Wrench } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { BackLink } from "@/components/app/back-link";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { useHotkey } from "@/hooks/use-hotkey";
import { CATALOG_SHORTCUTS } from "@/lib/shortcuts";
import { CatalogView } from "@/modules/garage/catalog/catalog-view";
import type { CatalogTarget } from "@/modules/garage/catalog/catalog-view";
import { catalogItemsQuery } from "@/modules/garage/catalog/catalog.queries";
import { ItemDialog } from "@/modules/garage/catalog/item-dialog";
import { PackageDialog } from "@/modules/garage/catalog/package-dialog";

const HeaderActions = ({
  onNewItem,
  onNewPackage,
}: {
  onNewItem: () => void;
  onNewPackage: () => void;
}) => {
  const { t } = useTranslation("garageCatalog");

  return (
    <>
      <span className="flex md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={t("newMenu")}
              size="icon-compact"
              variant="ghost"
            >
              <Plus />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onNewItem}>
              <Wrench />
              {t("items.add")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onNewPackage}>
              <Boxes />
              {t("packages.add")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </span>
      <span className="hidden gap-1.5 md:flex">
        <Button onClick={onNewPackage} size="compact" variant="outline">
          {t("packages.add")}
          <Kbd>{CATALOG_SHORTCUTS.newPackage.toUpperCase()}</Kbd>
        </Button>
        <Button onClick={onNewItem} size="compact">
          <Plus />
          {t("items.add")}
          <Kbd>{CATALOG_SHORTCUTS.newItem.toUpperCase()}</Kbd>
        </Button>
      </span>
    </>
  );
};

interface DialogState {
  open: boolean;
  target: CatalogTarget;
}

const CatalogPage = () => {
  const { t } = useTranslation("garageCatalog");
  const items = useQuery(catalogItemsQuery(true));

  // The target outlives `open`, so the dialog keeps its content while it animates out.
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    target: { item: null, kind: "item" },
  });

  const open = (target: CatalogTarget) => {
    setDialog({ open: true, target });
  };

  const setOpen = (next: boolean) => {
    setDialog((current) => ({ ...current, open: next }));
  };

  const newItem = () => {
    open({ item: null, kind: "item" });
  };

  const newPackage = () => {
    open({ kind: "package", pkg: null });
  };

  useHotkey(CATALOG_SHORTCUTS.newItem, newItem);
  useHotkey(CATALOG_SHORTCUTS.newPackage, newPackage);

  const { target } = dialog;

  const activeItems = (items.data?.items ?? []).filter(
    (item) => item.archivedAt === null
  );

  return (
    <>
      <PageHeader
        actions={
          <HeaderActions onNewItem={newItem} onNewPackage={newPackage} />
        }
        description={t("description")}
        mobileTop={<BackLink to="/garage" />}
        title={t("title")}
      />
      <CatalogView onOpen={open} />
      <ItemDialog
        item={target.kind === "item" ? target.item : null}
        onOpenChange={setOpen}
        open={dialog.open && target.kind === "item"}
      />
      <PackageDialog
        items={activeItems}
        onOpenChange={setOpen}
        open={dialog.open && target.kind === "package"}
        pkg={target.kind === "package" ? target.pkg : null}
      />
    </>
  );
};

export const Route = createFileRoute("/_app/garage/catalog")({
  component: CatalogPage,
});
