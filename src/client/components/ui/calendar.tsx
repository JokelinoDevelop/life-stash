"use client";

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import * as React from "react";
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from "react-day-picker";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * `popover`: fills its container (the date picker's popover): month and year as quiet
 * dropdowns on the left, arrows on the right, larger days, today marked with a dot.
 */
const POPOVER_CLASS_NAMES = {
  root: "w-full",
  month: "flex w-full flex-col gap-2",
  nav: "absolute top-0 right-0 flex items-center gap-0.5",
  month_caption: "flex h-(--cell-size) w-full items-center pr-18",
  dropdowns: "flex h-(--cell-size) items-center gap-0.5 text-sm font-semibold",
  dropdown_root:
    "hover:bg-accent has-focus:ring-ring/50 relative rounded-md transition-colors has-focus:ring-[3px]",
  caption_label:
    "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md px-2 text-sm font-semibold select-none [&>svg]:size-3.5",
  weekday:
    "text-muted-foreground flex-1 pb-1 text-[0.6875rem] font-medium tracking-wide uppercase select-none",
  week: "mt-0.5 flex w-full",
  today: "",
  outside: "text-muted-foreground/60 aria-selected:text-muted-foreground",
} satisfies Partial<Record<string, string>>;

/**
 * `month`: a full-width month grid for a page (Fitness). Phones: square cells with room under
 * the number for markers (status dots). Desktop: tall cells that fill the width, the number
 * top-left and the day's items listed under it; hairlines between days. With
 * `captionLayout="dropdown"`, month and year are quiet dropdowns on the left, arrows on the right.
 */
const MONTH_CLASS_NAMES = {
  root: "w-full",
  month: "flex w-full flex-col gap-3",
  nav: "absolute top-0 right-0 flex items-center gap-0.5",
  month_caption: "flex h-(--cell-size) w-full items-center pr-18",
  dropdowns:
    "flex h-(--cell-size) items-center gap-0.5 text-base font-semibold",
  dropdown_root:
    "hover:bg-accent has-focus:ring-ring/50 relative rounded-md transition-colors has-focus:ring-[3px]",
  caption_label:
    "[&>svg]:text-muted-foreground flex h-9 items-center gap-1 rounded-md px-2 text-base font-semibold select-none [&>svg]:size-4",
  month_grid: "w-full border-collapse",
  weekday:
    "text-muted-foreground flex-1 pb-1 text-[0.6875rem] font-medium tracking-wide uppercase select-none md:pb-2 md:text-left md:pl-2",
  week: "mt-1 flex w-full md:mt-0",
  day: "group/day relative aspect-square h-full w-full min-w-0 flex-1 p-0 text-center select-none md:aspect-auto md:h-(--month-cell-h,--spacing(24)) md:overflow-hidden md:border-divider md:border-t md:p-px md:[&:not(:first-child)]:border-l",
  today: "",
  outside: "text-muted-foreground/60 aria-selected:text-muted-foreground",
} satisfies Partial<Record<string, string>>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  variant = "default",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
  variant?: "default" | "popover" | "month";
}) {
  const defaultClassNames = getDefaultClassNames();
  const variantClassNames =
    variant === "popover"
      ? POPOVER_CLASS_NAMES
      : variant === "month"
        ? MONTH_CLASS_NAMES
        : null;

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar bg-background p-3 [--cell-size:--spacing(8)] data-[variant=month]:bg-transparent data-[variant=month]:[--cell-size:--spacing(10)] data-[variant=popover]:[--cell-size:--spacing(9)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "border-input has-focus:border-ring has-focus:ring-ring/50 relative rounded-md border shadow-xs has-focus:ring-[3px]",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "bg-popover absolute inset-0 opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "font-medium select-none",
          captionLayout === "label"
            ? "text-sm"
            : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pr-1 pl-2 text-sm [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground flex-1 rounded-md text-[0.8rem] font-normal select-none",
          defaultClassNames.weekday
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn(
          "w-(--cell-size) select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-muted-foreground text-[0.8rem] select-none",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-md",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-md"
            : "[&:first-child[data-selected=true]_button]:rounded-l-md",
          defaultClassNames.day
        ),
        range_start: cn(
          "bg-accent rounded-l-md",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("bg-accent rounded-r-md", defaultClassNames.range_end),
        today: cn(
          "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...(variantClassNames !== null
          ? Object.fromEntries(
              Object.entries(variantClassNames).map(([key, value]) => [
                key,
                cn(
                  value,
                  defaultClassNames[key as keyof typeof defaultClassNames]
                ),
              ])
            )
          : {}),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              data-variant={variant}
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            );
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            );
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          );
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-today={modifiers.today}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70",
        // Popover variant: today in the accent with a dot below (white on the selected day).
        "group-data-[variant=popover]/calendar:data-[today=true]:text-primary group-data-[variant=popover]/calendar:data-[today=true]:after:bg-primary group-data-[variant=popover]/calendar:data-[today=true]:data-[selected-single=true]:text-primary-foreground group-data-[variant=popover]/calendar:data-[today=true]:data-[selected-single=true]:after:bg-primary-foreground group-data-[variant=popover]/calendar:relative group-data-[variant=popover]/calendar:text-sm group-data-[variant=popover]/calendar:tabular-nums group-data-[variant=popover]/calendar:data-[today=true]:font-semibold group-data-[variant=popover]/calendar:data-[today=true]:after:absolute group-data-[variant=popover]/calendar:data-[today=true]:after:bottom-1 group-data-[variant=popover]/calendar:data-[today=true]:after:left-1/2 group-data-[variant=popover]/calendar:data-[today=true]:after:size-1 group-data-[variant=popover]/calendar:data-[today=true]:after:-translate-x-1/2 group-data-[variant=popover]/calendar:data-[today=true]:after:rounded-full",
        // Month variant: today's number in the accent and semibold.
        "group-data-[variant=month]/calendar:data-[today=true]:text-primary group-data-[variant=month]/calendar:data-[today=true]:data-[selected-single=true]:text-primary-foreground group-data-[variant=month]/calendar:tabular-nums group-data-[variant=month]/calendar:data-[today=true]:font-semibold",
        // Month variant, desktop: a tall cell, content from the top-left; the chosen day is a quiet accent with a ring.
        "md:group-data-[variant=month]/calendar:data-[selected-single=true]:bg-accent md:group-data-[variant=month]/calendar:data-[selected-single=true]:text-foreground md:group-data-[variant=month]/calendar:data-[selected-single=true]:ring-primary md:group-data-[variant=month]/calendar:data-[today=true]:data-[selected-single=true]:text-primary md:group-data-[variant=month]/calendar:aspect-auto md:group-data-[variant=month]/calendar:h-full md:group-data-[variant=month]/calendar:items-stretch md:group-data-[variant=month]/calendar:justify-start md:group-data-[variant=month]/calendar:gap-1 md:group-data-[variant=month]/calendar:p-1 md:group-data-[variant=month]/calendar:text-left md:group-data-[variant=month]/calendar:data-[selected-single=true]:ring-1",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
