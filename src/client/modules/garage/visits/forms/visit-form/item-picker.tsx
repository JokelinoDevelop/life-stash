import { ListPlus, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface PickerOption {
  id: string;
  label: string;
  hint?: string;
}

/** A searchable popover list; used for catalog items and packages. */
export const ItemPicker = ({
  label,
  options,
  onPick,
}: {
  label: string;
  options: PickerOption[];
  onPick: (option: PickerOption) => void;
}) => {
  const { t } = useTranslation("garageVisits");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();

  const matches = options.filter((option) =>
    option.label.toLowerCase().includes(needle)
  );

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={<Button size="sm" type="button" variant="outline" />}
      >
        <ListPlus />
        {label}
      </PopoverTrigger>
      <PopoverContent align="start">
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-2.5 left-2.5 size-4" />
            <div className="pl-7">
              <Input
                aria-label={t("form.search")}
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
                placeholder={t("form.search")}
                value={query}
              />
            </div>
          </div>
          <ul className="flex max-h-60 flex-col overflow-y-auto">
            {matches.length === 0 && (
              <li className="text-muted-foreground px-2 py-1.5 text-sm">
                {t("form.noResults")}
              </li>
            )}
            {matches.map((option) => (
              <li key={option.id}>
                <button
                  className="hover:bg-accent flex w-full flex-col rounded-md px-2 py-1.5 text-left text-sm"
                  onClick={() => {
                    onPick(option);
                    setOpen(false);
                    setQuery("");
                  }}
                  type="button"
                >
                  <span>{option.label}</span>
                  {option.hint !== undefined && (
                    <span className="text-muted-foreground text-xs">
                      {option.hint}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
};
