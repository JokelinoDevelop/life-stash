import type { ComponentProps } from "react";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";

import { FieldErrors } from "./field-errors";
import type { FieldLayout } from "./field-layout";
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
  /** `row`: label left, a compact right-aligned input right (settings lists). */
  layout?: FieldLayout;
}

export const TextField = ({
  label,
  description,
  optional,
  suffix,
  layout = "stacked",
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

  const row = layout === "row";

  const control =
    suffix === undefined ? (
      <Input {...inputProps} className={row ? "w-2/5 text-right" : undefined} />
    ) : (
      <InputGroup className={row ? "w-2/5" : undefined}>
        <InputGroupInput
          {...inputProps}
          className={row ? "text-right" : undefined}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>{suffix}</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    );

  if (row) {
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
          {control}
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
      {control}
      {description !== undefined && (
        <FieldDescription>{description}</FieldDescription>
      )}
      <FieldErrors errors={field.state.meta.errors} show={invalid} />
    </Field>
  );
};
