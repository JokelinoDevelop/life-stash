import { createFormHook } from "@tanstack/react-form";

import { fieldContext, formContext } from "./form-context";
import { PartialDateField } from "./partial-date-field";
import { SelectField } from "./select-field";
import { SubmitButton } from "./submit-button";
import { SwitchField } from "./switch-field";
import { TextField } from "./text-field";
import { TextareaField } from "./textarea-field";

/**
 * App-wide TanStack Form hook. Every form validates with its own Zod schema
 * (`validators: { onSubmit: schema }`) and renders fields through these components.
 */
export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    PartialDateField,
    SelectField,
    SwitchField,
    TextareaField,
    TextField,
  },
  formComponents: { SubmitButton },
  fieldContext,
  formContext,
});
