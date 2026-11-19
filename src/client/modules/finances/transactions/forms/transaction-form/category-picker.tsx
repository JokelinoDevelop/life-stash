import { ChevronDown, Tag } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type { FinanceCategory } from "../../../categories/categories.queries";
import { CategoryIcon } from "../../../categories/category-icon";
import { useCategoryName } from "../../../categories/category-label";

/** A chip that opens a searchable list of categories. */
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
  trigger?: "chip" | "more";
  value: string;
}) => {
  const { t } = useTranslation("finances");
  const nameOf = useCategoryName();
  const [open, setOpen] = useState(false);
  const selected = categories.find((category) => category.id === value);

  return (
    <Popover
      onOpenChange={(next) => {
        setOpen(next);

        if (!next) {
          onBlur();
        }
      }}
      open={open}
    >
      <PopoverTrigger asChild>
        {trigger === "more" ? (
          <Button size="xs" type="button" variant="chip">
            {label ?? t("form.more")}
          </Button>
        ) : (
          <Button
            aria-invalid={invalid}
            aria-label={t("form.category")}
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
        )}
      </PopoverTrigger>
      <PopoverContent align="start" variant="bare">
        <Command className="w-60">
          <CommandInput placeholder={t("form.category")} />
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
      </PopoverContent>
    </Popover>
  );
};
