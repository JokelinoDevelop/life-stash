import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";

import { DatePicker } from "./date-picker";
import { FieldErrors } from "./field-errors";
import { useFieldContext } from "./form-context";
import { OptionalHint } from "./optional-hint";

/** A `YYYY-MM-DD` form field picked with the calendar. Optional fields can be cleared. */
export const DateField = ({
  label,
  description,
  optional,
}: {
  label: string;
  description?: string;
  optional?: boolean;
}) => {
  const field = useFieldContext<string>();
  const invalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {optional === true && <OptionalHint />}
      </FieldLabel>
      <DatePicker
        clearable={optional === true}
        id={field.name}
        invalid={invalid}
        onBlur={field.handleBlur}
        onChange={(value) => {
          field.handleChange(value);
        }}
        value={field.state.value}
      />
      {description !== undefined && (
        <FieldDescription>{description}</FieldDescription>
      )}
      <FieldErrors errors={field.state.meta.errors} show={invalid} />
    </Field>
  );
};
