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
const useDateLabel = () => {
  const { t } = useTranslation();
  const format = useFormat();

  return (iso: string): string => {
    const today = todayIso();

    if (iso === today) {
      return t("date.today");
    }

    if (iso === addDays(today, -1)) {
      return t("date.yesterday");
    }

    return format.date(iso);
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
      className="h-7 min-w-0 flex-1"
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
  "aria-label"?: string;
}

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
  "aria-label": ariaLabel,
}: DatePickerProps) => {
  const { t, i18n } = useTranslation();
  const label = useDateLabel();
  const [open, setOpen] = useState(false);
  const selected = isoToDate(value);
  const today = todayIso();

  const pick = (iso: string) => {
    onChange(iso);
    setOpen(false);
    onBlur?.();
  };

  const text =
    selected === undefined ? (placeholder ?? t("date.pick")) : label(value);

  return (
    <Popover
      onOpenChange={(next) => {
        setOpen(next);

        if (!next) {
          onBlur?.();
        }
      }}
      open={open}
    >
      <PopoverTrigger asChild>
        <Button
          aria-invalid={invalid}
          aria-label={ariaLabel}
          className={cn(variant === "field" && "w-full")}
          data-empty={selected === undefined}
          id={id}
          size={variant === "chip" ? "xs" : "default"}
          type="button"
          variant="field"
        >
          <CalendarDays />
          <span className="truncate tabular-nums">{text}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" collisionPadding={8} variant="bare">
        <div className="border-divider flex items-center gap-1 border-b p-2">
          <TypedDateInput onPick={pick} />
          <Button
            onClick={() => {
              pick(today);
            }}
            size="xs"
            type="button"
            variant="ghost"
          >
            {t("date.today")}
          </Button>
          {clearable ? (
            <Button
              disabled={value === ""}
              onClick={() => {
                pick("");
              }}
              size="xs"
              type="button"
              variant="ghost"
            >
              {t("date.clear")}
            </Button>
          ) : (
            <Button
              onClick={() => {
                pick(addDays(today, -1));
              }}
              size="xs"
              type="button"
              variant="ghost"
            >
              {t("date.yesterday")}
            </Button>
          )}
        </div>
        <Calendar
          autoFocus
          className="[--cell-size:--spacing(7)]"
          captionLayout="dropdown"
          defaultMonth={selected ?? isoToDate(today)}
          endMonth={new Date(Number(today.slice(0, 4)) + YEARS_AHEAD, 11)}
          locale={i18n.language === "mk" ? mk : enGB}
          mode="single"
          onSelect={(date) => {
            if (date !== undefined) {
              pick(dateToIso(date));
            }
          }}
          selected={selected}
          startMonth={new Date(FIRST_YEAR, 0)}
        />
      </PopoverContent>
    </Popover>
  );
};
