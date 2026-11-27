import {
  addDays,
  isIsoDate,
  parseIsoDate,
  parseTypedDate,
} from "@shared/domain/dates";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { enGB, mk } from "react-day-picker/locale";
import { useTranslation } from "react-i18next";

import { useIsDesktop } from "@/components/app/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";
import { cn } from "@/lib/utils";

const FIRST_YEAR = 1950;
const YEARS_AHEAD = 10;

/** Local midnight of an ISO date, which is what the calendar works in. */
const isoToDate = (iso: string): Date | undefined => {
  if (!isIsoDate(iso)) {
    return undefined;
  }

  const { year, month, day } = parseIsoDate(iso);

  return new Date(year, month - 1, day);
};

const dateToIso = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
};

/** "Today", "Yesterday" or the formatted date. */
/** Today / Yesterday, else the date; `short` drops this year's year ("02.11") for chips. */
const useDateLabel = () => {
  const { t } = useTranslation();
  const format = useFormat();

  return (iso: string, short = false): string => {
    const today = todayIso();

    if (iso === today) {
      return t("date.today");
    }

    if (iso === addDays(today, -1)) {
      return t("date.yesterday");
    }

    return short && iso.slice(0, 4) === today.slice(0, 4)
      ? format.shortDate(iso)
      : format.date(iso);
  };
};

const TypedDateInput = ({ onPick }: { onPick: (iso: string) => void }) => {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [invalid, setInvalid] = useState(false);

  return (
    <Input
      aria-invalid={invalid}
      aria-label={t("date.type")}
      className="h-8 w-full"
      onChange={(event) => {
        setText(event.target.value);
        setInvalid(false);
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter") {
          return;
        }

        // Enter picks the typed date; it must not submit the form behind.
        event.preventDefault();
        event.stopPropagation();
        const iso = parseTypedDate(text);

        if (iso === null) {
          setInvalid(true);
        } else {
          onPick(iso);
        }
      }}
      placeholder={t("date.typePlaceholder")}
      value={text}
    />
  );
};

/** A quick pick in the footer ("Today", "Yesterday"), pressed when it is the chosen date. */
const QuickPick = ({
  active,
  label,
  onPick,
}: {
  active: boolean;
  label: string;
  onPick: () => void;
}) => (
  <Button
    aria-pressed={active}
    onClick={onPick}
    size="sm"
    type="button"
    variant="chip"
  >
    {label}
  </Button>
);

export interface DatePickerProps {
  /** `YYYY-MM-DD`, or "" for no date. */
  value: string;
  onChange: (value: string) => void;
  /** Called when the picker closes, so the field counts as touched. */
  onBlur?: () => void;
  id?: string;
  invalid?: boolean;
  /** Offer "Clear" (for optional dates). */
  clearable?: boolean;
  placeholder?: string;
  /** `field`: full-width like an input. `chip`: a small inline button. */
  variant?: "field" | "chip";
  /**
   * Dates that chips beside the picker already offer (Today, Yesterday): while one of
   * them is chosen the picker shows just its calendar icon, so the label isn't repeated.
   */
  quickDates?: readonly string[];
  "aria-label"?: string;
}

/** Typed entry, the calendar and Today / Yesterday / Clear: the same in a popover or a sheet. */
const PickerPanel = ({
  autoFocusCalendar,
  clearable,
  onPick,
  value,
}: {
  autoFocusCalendar: boolean;
  clearable: boolean;
  onPick: (iso: string) => void;
  value: string;
}) => {
  const { t, i18n } = useTranslation();
  const selected = isoToDate(value);
  const today = todayIso();

  return (
    <>
      <div className="border-divider border-b p-2">
        <TypedDateInput onPick={onPick} />
      </div>
      <Calendar
        autoFocus={autoFocusCalendar}
        captionLayout="dropdown"
        defaultMonth={selected ?? isoToDate(today)}
        endMonth={new Date(Number(today.slice(0, 4)) + YEARS_AHEAD, 11)}
        locale={i18n.language === "mk" ? mk : enGB}
        mode="single"
        onSelect={(date) => {
          if (date !== undefined) {
            onPick(dateToIso(date));
          }
        }}
        selected={selected}
        startMonth={new Date(FIRST_YEAR, 0)}
        variant="popover"
      />
      <div className="border-divider flex items-center gap-1 border-t p-2">
        <QuickPick
          active={value === today}
          label={t("date.today")}
          onPick={() => {
            onPick(today);
          }}
        />
        <QuickPick
          active={value === addDays(today, -1)}
          label={t("date.yesterday")}
          onPick={() => {
            onPick(addDays(today, -1));
          }}
        />
        {clearable && (
          <Button
            className="ml-auto"
            disabled={value === ""}
            onClick={() => {
              onPick("");
            }}
            size="xs"
            type="button"
            variant="ghost"
          >
            {t("date.clear")}
          </Button>
        )}
      </div>
    </>
  );
};

/** shadcn date picker: a button that opens a calendar with Today / Yesterday and typed entry. */
export const DatePicker = ({
  value,
  onChange,
  onBlur,
  id,
  invalid = false,
  clearable = false,
  placeholder,
  variant = "field",
  quickDates,
  "aria-label": ariaLabel,
}: DatePickerProps) => {
  const { t } = useTranslation();
  const label = useDateLabel();
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);
  const empty = !isIsoDate(value);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);

    if (!next) {
      onBlur?.();
    }
  };

  const pick = (iso: string) => {
    onChange(iso);
    setOpen(false);
    onBlur?.();
  };

  const text = empty
    ? (placeholder ?? t("date.pick"))
    : label(value, variant === "chip");

  const triggerProps = {
    "aria-invalid": invalid,
    "aria-label": ariaLabel,
    className: cn(variant === "field" && "w-full"),
    "data-empty": empty,
    size: variant === "chip" ? ("chip" as const) : ("default" as const),
    type: "button" as const,
    variant: "field" as const,
    id,
  };

  const iconOnly = quickDates?.includes(value) === true;

  const triggerContent = (
    <>
      <CalendarDays />
      {iconOnly ? (
        <span className="sr-only">{text}</span>
      ) : (
        <span className="truncate tabular-nums">{text}</span>
      )}
    </>
  );

  const panel = (
    <PickerPanel
      autoFocusCalendar={isDesktop}
      clearable={clearable}
      onPick={pick}
      value={value}
    />
  );

  // Phones: the system date picker (wheels on iOS, a calendar on Android) through a
  // transparent native input laid over the chip, so one tap opens it.
  if (!isDesktop) {
    return (
      <span
        className={cn("relative inline-flex", variant === "field" && "w-full")}
      >
        <Button
          {...triggerProps}
          aria-hidden="true"
          id={undefined}
          nativeButton={false}
          render={<span />}
          tabIndex={-1}
        >
          {triggerContent}
        </Button>
        <input
          aria-invalid={invalid}
          aria-label={ariaLabel ?? text}
          className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
          id={id}
          max={`${Number(todayIso().slice(0, 4)) + YEARS_AHEAD}-12-31`}
          min={`${FIRST_YEAR}-01-01`}
          onBlur={onBlur}
          onChange={(event) => {
            const next = event.target.value;

            if (isIsoDate(next) || (clearable && next === "")) {
              onChange(next);
            }
          }}
          type="date"
          value={empty ? "" : value}
        />
      </span>
    );
  }

  return (
    <Popover onOpenChange={handleOpenChange} open={open}>
      <PopoverTrigger render={<Button {...triggerProps} />}>
        {triggerContent}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[18.5rem]"
        collisionPadding={8}
        variant="bare"
      >
        {panel}
      </PopoverContent>
    </Popover>
  );
};
