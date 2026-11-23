import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FieldErrors } from "./field-errors";
import type { FieldLayout } from "./field-layout";
import { useFieldContext } from "./form-context";
import { OptionalHint } from "./optional-hint";

export interface SelectOption {
  value: string;
  label: string;
}

/** Select bound to a string field. An empty string means "nothing selected". */
export const SelectField = ({
  label,
  options,
  optional,
  placeholder,
  description,
  layout = "stacked",
}: {
  label: string;
  options: readonly SelectOption[];
  optional?: boolean;
  placeholder?: string;
  description?: string;
  /** `row`: label left, a compact select right (settings lists). */
  layout?: FieldLayout;
}) => {
  const field = useFieldContext<string>();
  const invalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const select = (
    <Select
      items={options}
      name={field.name}
      onValueChange={(value) => {
        field.handleChange(value ?? "");
        field.handleBlur();
      }}
      value={field.state.value === "" ? null : field.state.value}
    >
      <SelectTrigger
        aria-invalid={invalid}
        className={layout === "row" ? "max-w-3/5" : "w-full"}
        id={field.name}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (layout === "row") {
    return (
      <div className="flex min-h-12 items-center px-3 py-1.5 md:min-h-11">
        <Field data-invalid={invalid} orientation="horizontal">
          {/* A plain label centres with the control; with help text or an
              error the column top-aligns instead. */}
          {description === undefined && !invalid ? (
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          ) : (
            <FieldContent>
              <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
              {description !== undefined && (
                <FieldDescription>{description}</FieldDescription>
              )}
              <FieldErrors errors={field.state.meta.errors} show={invalid} />
            </FieldContent>
          )}
          {select}
        </Field>
      </div>
    );
  }

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {optional === true && <OptionalHint />}
      </FieldLabel>
      {select}
      {description !== undefined && (
        <FieldDescription>{description}</FieldDescription>
      )}
      <FieldErrors errors={field.state.meta.errors} show={invalid} />
    </Field>
  );
};
