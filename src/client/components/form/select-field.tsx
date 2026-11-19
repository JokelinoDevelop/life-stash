import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FieldErrors } from "./field-errors";
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
}: {
  label: string;
  options: readonly SelectOption[];
  optional?: boolean;
  placeholder?: string;
  description?: string;
}) => {
  const field = useFieldContext<string>();
  const invalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {optional === true && <OptionalHint />}
      </FieldLabel>
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
          className="w-full"
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
      {description !== undefined && (
        <FieldDescription>{description}</FieldDescription>
      )}
      <FieldErrors errors={field.state.meta.errors} show={invalid} />
    </Field>
  );
};
