import { ChevronDown, MoreHorizontal, Tag } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ResponsivePicker } from "@/components/form/responsive-picker";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

import type { FinanceCategory } from "../../../categories/categories.queries";
import { CategoryIcon } from "../../../categories/category-icon";
import { useCategoryName } from "../../../categories/category-label";

/** Phones: one category as a tile (icon over name) in the Add transaction grid. */
export const CATEGORY_TILE =
  "border-border bg-card aria-pressed:border-primary aria-pressed:bg-accent flex h-17 min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border text-xs font-medium transition-colors active:scale-[.98] aria-pressed:font-semibold";

/** A chip that opens a searchable list of categories (a sheet on phones). */
export const CategoryPicker = ({
  categories,
  invalid,
  label,
  onBlur,
  onChange,
  trigger = "chip",
  value,
}: {
  categories: readonly FinanceCategory[];
  invalid: boolean;
  label?: string;
  onBlur: () => void;
  onChange: (categoryId: string) => void;
  trigger?: "chip" | "more" | "tile";
  value: string;
}) => {
  const { t } = useTranslation("finances");
  const nameOf = useCategoryName();
  const [open, setOpen] = useState(false);
  const categoryLabel = t("form.category");
  const selected = categories.find((category) => category.id === value);

  return (
    <ResponsivePicker
      onOpenChange={(next) => {
        setOpen(next);

        if (!next) {
          onBlur();
        }
      }}
      open={open}
      title={categoryLabel}
      renderTrigger={(props) => {
        if (trigger === "tile") {
          return (
            <button {...props} className={CATEGORY_TILE} type="button">
              <span className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-lg">
                <MoreHorizontal className="size-4" />
              </span>
              <span className="max-w-full truncate px-1">
                {label ?? t("form.more")}
              </span>
            </button>
          );
        }

        if (trigger === "more") {
          return (
            <Button {...props} size="xs" type="button" variant="chip">
              {label ?? t("form.more")}
            </Button>
          );
        }

        return (
          <Button
            {...props}
            aria-invalid={invalid}
            aria-label={categoryLabel}
            data-empty={selected === undefined}
            id="categoryId"
            size="xs"
            type="button"
            variant="field"
          >
            {selected === undefined ? (
              <Tag />
            ) : (
              <CategoryIcon bare name={selected.icon} />
            )}
            <span className={cn(selected !== undefined && "text-foreground")}>
              {selected === undefined
                ? t("form.pickCategory")
                : nameOf(selected)}
            </span>
            <ChevronDown className="opacity-60" />
          </Button>
        );
      }}
    >
      <Command>
        <CommandInput placeholder={categoryLabel} />
        <CommandList>
          <CommandEmpty>—</CommandEmpty>
          <CommandGroup>
            {categories.map((category) => (
              <CommandItem
                key={category.id}
                onSelect={() => {
                  onChange(category.id);
                  setOpen(false);
                }}
                value={`${nameOf(category)} ${category.id}`}
              >
                <CategoryIcon bare name={category.icon} />
                {nameOf(category)}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </ResponsivePicker>
  );
};
