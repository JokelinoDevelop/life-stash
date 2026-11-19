import type { TransactionKind } from "@shared/domain/finances/kinds";
import { useQuery } from "@tanstack/react-query";
import { GripVertical, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ErrorState, LoadingState } from "@/components/app/states";
import { cn } from "@/lib/utils";
import { SettingsSection } from "@/modules/settings/settings-section";

import { useFinanceDialog } from "../dialogs/use-finance-dialog";
import { useUpdateCategory } from "./categories.mutations";
import { categoriesQuery } from "./categories.queries";
import type { FinanceCategory } from "./categories.queries";
import { CategoryIcon } from "./category-icon";
import { useCategoryName } from "./category-label";
import { CategoryMenu } from "./category-menu";

const rowClass =
  "group/row flex min-h-12 items-center gap-2.5 px-3 text-sm md:min-h-10";

const CategoryRow = ({
  category,
  draggable,
  index,
  onDragStart,
  onDropAt,
  siblings,
}: {
  category: FinanceCategory;
  draggable: boolean;
  index: number;
  onDragStart: (index: number) => void;
  onDropAt: (index: number) => void;
  siblings: number;
}) => {
  const { t } = useTranslation("finances");
  const nameOf = useCategoryName();
  const [over, setOver] = useState(false);

  return (
    // Drag to reorder is a pointer shortcut; the ⋯ menu's Move up / Move down is the keyboard path.
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <li
      className={cn(rowClass, "data-[over=true]:bg-accent")}
      data-over={over}
      draggable={draggable}
      onDragEnd={() => {
        setOver(false);
      }}
      onDragLeave={() => {
        setOver(false);
      }}
      onDragOver={(event) => {
        if (draggable) {
          event.preventDefault();
          setOver(true);
        }
      }}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        onDragStart(index);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        onDropAt(index);
      }}
    >
      <GripVertical
        aria-label={draggable ? t("categories.reorder") : undefined}
        className={
          draggable
            ? "text-muted-foreground/60 size-3.5 shrink-0 cursor-grab"
            : "size-3.5 shrink-0 opacity-0"
        }
      />
      <CategoryIcon name={category.icon} />
      <span className="min-w-0 flex-1 truncate font-medium">
        {nameOf(category)}
        {category.systemKey !== null && (
          <span className="bg-muted text-muted-foreground ml-2 rounded-sm border px-1.5 py-px text-xs font-medium">
            {t("categories.system")}
          </span>
        )}
      </span>
      <span className="text-muted-foreground text-xs tabular-nums md:text-sm">
        {t("categories.entries", { count: category.entryCount })}
      </span>
      {category.systemKey === null ? (
        <CategoryMenu category={category} index={index} siblings={siblings} />
      ) : (
        <span className="size-11 md:size-7" />
      )}
    </li>
  );
};

const CategoryList = ({
  categories,
  kind,
}: {
  categories: readonly FinanceCategory[];
  kind: TransactionKind;
}) => {
  const { t } = useTranslation("finances");
  const dialog = useFinanceDialog();
  const move = useUpdateCategory(false);
  const dragged = useRef<number | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const ofKind = categories.filter((category) => category.kind === kind);
  const active = ofKind.filter((category) => !category.archived);
  const archived = ofKind.filter((category) => category.archived);

  const dropAt = (index: number) => {
    const start = dragged.current;
    const from = start === null ? undefined : active[start];
    dragged.current = null;

    if (from === undefined || start === index) {
      return;
    }

    move.mutate({ id: from.id, json: { position: index } });
  };

  return (
    <ul className="divide-divider divide-y">
      {active.map((category, index) => (
        <CategoryRow
          category={category}
          draggable={category.systemKey === null}
          index={index}
          key={category.id}
          onDragStart={(position) => {
            dragged.current = position;
          }}
          onDropAt={dropAt}
          siblings={active.length}
        />
      ))}
      {showArchived &&
        archived.map((category, index) => (
          <CategoryRow
            category={category}
            draggable={false}
            index={index}
            key={category.id}
            onDragStart={() => null}
            onDropAt={() => null}
            siblings={archived.length}
          />
        ))}
      {archived.length > 0 && (
        <li className={rowClass}>
          <button
            className="text-muted-foreground hover:text-foreground pl-6 text-sm"
            onClick={() => {
              setShowArchived((value) => !value);
            }}
            type="button"
          >
            {showArchived
              ? t("categories.hideArchived")
              : t("categories.showArchived", { count: archived.length })}
          </button>
        </li>
      )}
      <li>
        <button
          className="text-primary hover:bg-background flex min-h-12 w-full items-center gap-2 px-3 text-sm font-medium transition-colors md:min-h-10"
          onClick={() => {
            void dialog.open({ dialog: "category", entryKind: kind });
          }}
          type="button"
        >
          <Plus className="size-4" />
          {t("categories.add")}
        </button>
      </li>
    </ul>
  );
};

/** Settings › Finances: expense and income categories (4.1). */
export const CategoriesSettings = () => {
  const { t } = useTranslation("finances");
  const categories = useQuery(categoriesQuery);

  const body = (kind: TransactionKind) => {
    if (categories.isPending) {
      return <LoadingState rows={4} variant="rows" />;
    }

    if (categories.isError) {
      return (
        <ErrorState
          className="m-3 md:m-3"
          error={categories.error}
          onRetry={() => {
            void categories.refetch();
          }}
        />
      );
    }

    return <CategoryList categories={categories.data.categories} kind={kind} />;
  };

  return (
    <>
      <SettingsSection
        description={t("categories.expenseDescription")}
        flush
        title={t("categories.expenseTitle")}
      >
        {body("expense")}
      </SettingsSection>
      <SettingsSection
        description={t("categories.incomeDescription")}
        flush
        title={t("categories.incomeTitle")}
      >
        {body("income")}
      </SettingsSection>
    </>
  );
};
