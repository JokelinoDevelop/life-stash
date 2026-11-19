import {
  ArrowDown,
  ArrowUp,
  Archive,
  ArchiveRestore,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { useConfirm } from "@/components/app/confirm/confirm-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useFinanceDialog } from "../dialogs/use-finance-dialog";
import {
  useArchiveCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "./categories.mutations";
import type { FinanceCategory } from "./categories.queries";
import { useCategoryName } from "./category-label";

/** ⋯ on a category row: rename, move, archive (in use) or delete (unused). */
export const CategoryMenu = ({
  category,
  index,
  siblings,
}: {
  category: FinanceCategory;
  index: number;
  siblings: number;
}) => {
  const { t } = useTranslation("finances");
  const nameOf = useCategoryName();
  const confirm = useConfirm();
  const dialog = useFinanceDialog();
  const move = useUpdateCategory(false);
  const archive = useArchiveCategory();
  const remove = useDeleteCategory();
  const name = nameOf(category);

  const onArchive = async () => {
    if (category.archived) {
      archive.mutate({ archived: false, id: category.id });

      return;
    }

    const ok = await confirm({
      confirmLabel: t("categories.archive"),
      description: t("categories.archiveDescription", {
        count: category.entryCount,
      }),
      title: t("categories.archiveTitle", { name }),
    });

    if (ok) {
      archive.mutate({ archived: true, id: category.id });
    }
  };

  const onDelete = async () => {
    const ok = await confirm({
      description: t("categories.deleteDescription"),
      title: t("categories.deleteTitle", { name }),
      tone: "destructive",
    });

    if (ok) {
      remove.mutate(category.id);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={t("categories.moreFor", { name })}
          size="icon-compact"
          variant="ghost"
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onSelect={() => {
            void dialog.open({ dialog: "category", id: category.id });
          }}
        >
          <Pencil />
          {t("categories.rename")}
        </DropdownMenuItem>
        {!category.archived && (
          <>
            <DropdownMenuItem
              disabled={index === 0}
              onSelect={() => {
                move.mutate({ id: category.id, json: { position: index - 1 } });
              }}
            >
              <ArrowUp />
              {t("categories.moveUp")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={index >= siblings - 1}
              onSelect={() => {
                move.mutate({ id: category.id, json: { position: index + 1 } });
              }}
            >
              <ArrowDown />
              {t("categories.moveDown")}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        {category.entryCount > 0 || category.archived ? (
          <DropdownMenuItem
            onSelect={() => {
              void onArchive();
            }}
          >
            {category.archived ? <ArchiveRestore /> : <Archive />}
            {category.archived
              ? t("categories.unarchive")
              : t("categories.archive")}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={() => {
              void onDelete();
            }}
            variant="destructive"
          >
            <Trash2 />
            {t("categories.delete")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
