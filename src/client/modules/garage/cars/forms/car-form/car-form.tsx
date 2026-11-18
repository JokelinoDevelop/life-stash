import { useTranslation } from "react-i18next";

import { useAppForm } from "@/components/form/form-hook";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { CarIdentityFields, CarPurchaseFields } from "./car-form-sections";
import { carFormSchema } from "./schema";
import type { CarFormValues } from "./schema";

export const CarForm = ({
  defaultValues,
  onSubmit,
}: {
  defaultValues: CarFormValues;
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
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <Card>
        <CardContent>
          <CarIdentityFields form={form} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("carForm.purchase")}</CardTitle>
        </CardHeader>
        <CardContent>
          <CarPurchaseFields form={form} />
        </CardContent>
      </Card>
      <form.AppForm>
        <form.SubmitButton className="self-end" />
      </form.AppForm>
    </form>
  );
};
