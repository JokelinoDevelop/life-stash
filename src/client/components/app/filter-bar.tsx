import { Check, ChevronDown, X } from "lucide-react";
import { Fragment, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { PickerSheet } from "@/components/form/picker-sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { useIsDesktop } from "./responsive-dialog";

export interface FilterOption {
  value: string;
  label: string;
}

/** A run of options; a labelled group gets a heading, an unlabelled one a separator. */
export interface FilterGroup {
  label?: string;
  options: readonly FilterOption[];
}

/**
 * A list page's filters. Desktop: one row under the header. Phones: the status tabs
 * (`status`) full width on their own row, the filter chips below in one row that
 * scrolls sideways, both pinned under the top bar while the list scrolls.
 */
export const FilterBar = ({
  children,
  status,
  sticky = true,
  trailing,
}: {
  children: ReactNode;
  status?: ReactNode;
  /** Phones: pin under the top bar (lists). Off for dashboards. */
  sticky?: boolean;
  trailing?: ReactNode;
}) => (
  <div
    className={cn(
      "md:border-divider -mx-4 flex flex-col gap-2.5 md:static md:mx-0 md:flex-row md:flex-wrap md:items-center md:gap-1.5 md:border-b md:bg-transparent md:px-5 md:py-2 md:backdrop-blur-none",
      sticky &&
        "bg-background border-divider sticky top-11 z-10 border-b pt-1 pb-2.5"
    )}
  >
    {status !== undefined && <div className="px-4 md:contents">{status}</div>}
    <div className="flex scrollbar-none items-center gap-2 overflow-x-auto px-4 md:contents">
      {children}
    </div>
    {trailing}
  </div>
);

const SheetOptions = ({
  groups,
  onPick,
  value,
}: {
  groups: readonly FilterGroup[];
  onPick: (value: string) => void;
  value: string;
}) => (
  <div className="max-h-[60dvh] overflow-y-auto pb-2">
    {groups.map((group, index) => (
      <div
        className={cn(index > 0 && "border-divider mt-1 border-t pt-1")}
        key={group.label ?? group.options[0]?.value ?? "empty"}
      >
        {group.label !== undefined && (
          <p className="text-muted-foreground px-4 pt-2 pb-1 text-xs font-medium">
            {group.label}
          </p>
        )}
        {group.options.map((option) => {
          const selected = option.value === value;

          return (
            <button
              aria-pressed={selected}
              className="active:bg-accent flex min-h-13 w-full items-center gap-3 px-4 text-left text-base"
              key={option.value}
              onClick={() => {
                onPick(option.value);
              }}
              type="button"
            >
              <span
                className={cn("flex-1 truncate", selected && "font-medium")}
              >
                {option.label}
              </span>
              {selected && <Check className="text-primary size-4.5" />}
            </button>
          );
        })}
      </div>
    ))}
  </div>
);

/**
 * One filter. Desktop: the compact select chip. Phones: a chip that opens a bottom sheet;
 * once set (`value` differs from `emptyValue`) it fills in and shows × to clear it.
 */
export const FilterSelect = ({
  display,
  emptyValue,
  groups,
  icon,
  label,
  onValueChange,
  value,
}: {
  /** What the chip shows (the chosen option, or the "all" label). */
  display: string;
  /** The value that means "not filtering"; `undefined` for a filter that is always set. */
  emptyValue?: string;
  groups: readonly FilterGroup[];
  icon: ReactNode;
  /** Accessible name and the sheet's title. */
  label: string;
  onValueChange: (value: string) => void;
  value: string;
}) => {
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);
  const active = emptyValue !== undefined && value !== emptyValue;

  if (isDesktop) {
    return (
      <Select
        onValueChange={(next) => {
          if (next !== null) {
            onValueChange(next);
          }
        }}
        value={value}
      >
        <SelectTrigger aria-label={label} size="chip">
          {icon}
          {display}
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false}>
          {groups.map((group, index) => (
            <Fragment key={group.label ?? group.options[0]?.value ?? "empty"}>
              {index > 0 && group.label === undefined && <SelectSeparator />}
              <SelectGroup>
                {group.label !== undefined && (
                  <SelectLabel>{group.label}</SelectLabel>
                )}
                {group.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </Fragment>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      {active && emptyValue !== undefined ? (
        <span className="border-primary bg-accent text-foreground inline-flex h-9 shrink-0 items-center rounded-full border text-sm font-medium [&_svg]:size-3.5 [&_svg]:shrink-0">
          <button
            aria-haspopup="dialog"
            aria-label={`${label}: ${display}`}
            className="flex h-full items-center gap-1.5 pr-1 pl-3"
            onClick={() => {
              setOpen(true);
            }}
            type="button"
          >
            {icon}
            {display}
          </button>
          <button
            aria-label={t("filters.clear", { label })}
            className="text-muted-foreground flex h-full items-center pr-2.5 pl-1"
            onClick={() => {
              onValueChange(emptyValue);
            }}
            type="button"
          >
            <X />
          </button>
        </span>
      ) : (
        <Button
          aria-haspopup="dialog"
          aria-label={`${label}: ${display}`}
          onClick={() => {
            setOpen(true);
          }}
          size="chip"
          variant="chip"
        >
          {icon}
          {display}
          <ChevronDown className="text-muted-foreground" />
        </Button>
      )}
      <PickerSheet onOpenChange={setOpen} open={open} title={label}>
        <SheetOptions
          groups={groups}
          onPick={(next) => {
            setOpen(false);
            onValueChange(next);
          }}
          value={value}
        />
      </PickerSheet>
    </>
  );
};
