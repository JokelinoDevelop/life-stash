import { useTranslation } from "react-i18next";

import { DialogForm, FormSection } from "@/components/form/dialog-form";
import { useAppForm } from "@/components/form/form-hook";

import { CarIdentityFields, CarPurchaseFields } from "./car-form-sections";
import { carFormSchema } from "./schema";
import type { CarFormValues } from "./schema";

export const CarForm = ({
  defaultValues,
  onCancel,
  onSubmit,
}: {
  defaultValues: CarFormValues;
  onCancel: () => void;
  onSubmit: (values: CarFormValues) => Promise<void>;
}) => {
  const { t } = useTranslation("garage");

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: { onSubmit: carFormSchema },
  });

  return (
    <DialogForm
      footer={
        <form.AppForm>
          <form.FormFooter onCancel={onCancel} />
        </form.AppForm>
      }
      onSubmit={() => {
        void form.handleSubmit();
      }}
    >
      <FormSection>
        <CarIdentityFields form={form} />
      </FormSection>
      <FormSection title={t("carForm.purchase")}>
        <CarPurchaseFields form={form} />
      </FormSection>
    </DialogForm>
  );
};
