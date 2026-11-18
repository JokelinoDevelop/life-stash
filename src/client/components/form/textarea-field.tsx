import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

import { FieldErrors } from "./field-errors";
import { useFieldContext } from "./form-context";
import { OptionalHint } from "./optional-hint";

export const TextareaField = ({
  label,
  optional,
  placeholder,
}: {
  label: string;
  optional?: boolean;
  placeholder?: string;
}) => {
  const field = useFieldContext<string>();
  const invalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {optional === true && <OptionalHint />}
      </FieldLabel>
      <Textarea
        aria-invalid={invalid}
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(event) => {
          field.handleChange(event.target.value);
        }}
        placeholder={placeholder}
        rows={3}
        value={field.state.value}
      />
      <FieldErrors errors={field.state.meta.errors} show={invalid} />
    </Field>
  );
};
