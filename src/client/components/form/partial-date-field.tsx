import { DATE_PRECISIONS } from "@shared/domain/dates";
import type { DatePrecision } from "@shared/domain/dates";
import { useTranslation } from "react-i18next";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { PartialDateValue } from "@/lib/partial-date";

import { DatePicker } from "./date-picker";
import { FieldErrors } from "./field-errors";
import { useFieldContext } from "./form-context";

const MONTHS = Array.from({ length: 12 }, (_, index) => String(index + 1));

const monthFormats = new Map<string, Intl.DateTimeFormat>();

/** Month name in the given language; formatted in UTC so it never shifts a month. */
const monthName = (language: string, month: string): string => {
  const locale = language === "mk" ? "mk-MK" : "en-GB";
  let format = monthFormats.get(locale);

  if (!format) {
    format = new Intl.DateTimeFormat(locale, {
      month: "long",
      timeZone: "UTC",
    });
    monthFormats.set(locale, format);
  }

  return format.format(new Date(Date.UTC(2000, Number(month) - 1, 1)));
};

const isPrecision = (value: string): value is DatePrecision =>
  DATE_PRECISIONS.some((precision) => precision === value);

/** Date input that also accepts "month and year" or "year only" for old records. */
export const PartialDateField = ({
  label,
  allowPartial = true,
}: {
  label: string;
  allowPartial?: boolean;
}) => {
  const field = useFieldContext<PartialDateValue>();
  const { t, i18n } = useTranslation();
  const { value } = field.state;
  const invalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const update = (patch: Partial<PartialDateValue>) => {
    field.handleChange({ ...value, ...patch });
  };

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={`${field.name}-input`}>{label}</FieldLabel>
      {allowPartial && (
        <ToggleGroup
          className="w-full"
          onValueChange={(next) => {
            if (isPrecision(next)) {
              update({ precision: next });
            }
          }}
          size="sm"
          type="single"
          value={value.precision}
          variant="outline"
        >
          {DATE_PRECISIONS.map((precision) => (
            <ToggleGroupItem
              className="flex-1"
              key={precision}
              value={precision}
            >
              {t(`date.precision.${precision}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
      {value.precision === "day" && (
        <DatePicker
          id={`${field.name}-input`}
          invalid={invalid}
          onBlur={field.handleBlur}
          onChange={(date) => {
            update({ date });
          }}
          value={value.date}
        />
      )}
      {value.precision !== "day" && (
        <div className="flex gap-2">
          {value.precision === "month" && (
            <Select
              onValueChange={(month) => {
                update({ month });
              }}
              value={value.month}
            >
              <SelectTrigger aria-label={t("date.month")} className="flex-1">
                <SelectValue placeholder={t("date.month")} />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month} value={month}>
                    {monthName(i18n.language, month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Input
            aria-invalid={invalid}
            aria-label={t("date.year")}
            className="w-28"
            id={`${field.name}-input`}
            inputMode="numeric"
            maxLength={4}
            onBlur={field.handleBlur}
            onChange={(event) => {
              update({ year: event.target.value });
            }}
            placeholder={t("date.year")}
            value={value.year}
          />
        </div>
      )}
      <FieldErrors errors={field.state.meta.errors} show={invalid} />
    </Field>
  );
};
