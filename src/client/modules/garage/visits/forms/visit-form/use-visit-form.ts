import { useAppForm } from "@/components/form/form-hook";

import { visitFormSchema } from "./schema";
import type { VisitFormValues } from "./schema";

export const useVisitForm = (
  defaultValues: VisitFormValues,
  onSubmit: (values: VisitFormValues) => Promise<void>
) =>
  useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: { onSubmit: visitFormSchema },
  });

export type VisitFormApi = ReturnType<typeof useVisitForm>;
