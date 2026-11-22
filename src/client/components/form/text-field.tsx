import type { ComponentProps } from "react";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";

import { FieldErrors } from "./field-errors";
import { useFieldContext } from "./form-context";
import { OptionalHint } from "./optional-hint";

export interface TextFieldProps {
  label: string;
  description?: string;
  optional?: boolean;
  /** Unit shown inside the input, e.g. "km" or "weeks". */
  suffix?: string;
  placeholder?: string;
  inputMode?: ComponentProps<"input">["inputMode"];
  type?: ComponentProps<"input">["type"];
  autoComplete?: string;
  autoFocus?: boolean;
  /** Id of a `<datalist>` with suggestions (quick picks that can still be typed over). */
  list?: string;
}

export const TextField = ({
  label,
  description,
  optional,
  suffix,
  ...input
}: TextFieldProps) => {
  const field = useFieldContext<string>();
  const invalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const inputProps = {
    "aria-invalid": invalid,
    id: field.name,
    name: field.name,
    onBlur: field.handleBlur,
    onChange: (event: { target: { value: string } }) => {
      field.handleChange(event.target.value);
    },
    value: field.state.value,
    ...input,
  };

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {optional === true && <OptionalHint />}
      </FieldLabel>
      {suffix === undefined ? (
        <Input {...inputProps} />
      ) : (
        <InputGroup>
          <InputGroupInput {...inputProps} />
          <InputGroupAddon align="inline-end">
            <InputGroupText>{suffix}</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      )}
      {description !== undefined && (
        <FieldDescription>{description}</FieldDescription>
      )}
      <FieldErrors errors={field.state.meta.errors} show={invalid} />
    </Field>
  );
};
