import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";

import { useFieldContext } from "./form-context";

export const SwitchField = ({
  label,
  description,
}: {
  label: string;
  description?: string;
}) => {
  const field = useFieldContext<boolean>();

  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
        {description !== undefined && (
          <FieldDescription>{description}</FieldDescription>
        )}
      </FieldContent>
      <Switch
        checked={field.state.value}
        id={field.name}
        name={field.name}
        onCheckedChange={(checked) => {
          field.handleChange(checked);
        }}
      />
    </Field>
  );
};
