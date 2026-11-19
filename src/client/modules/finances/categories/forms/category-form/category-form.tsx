import { CATEGORY_ICONS, isCategoryIcon } from "@shared/domain/finances/kinds";
import { createElement } from "react";
import { useTranslation } from "react-i18next";

import { DialogForm, FormSection } from "@/components/form/dialog-form";
import { useAppForm } from "@/components/form/form-hook";
import { FieldGroup, FieldLabel } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { CATEGORY_ICON_COMPONENTS } from "../../category-icons";
import { categoryFormSchema } from "./schema";
import type { CategoryFormValues } from "./schema";

export const CategoryForm = ({
  defaultValues,
  onCancel,
  onSubmit,
}: {
  defaultValues: CategoryFormValues;
  onCancel: () => void;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
}) => {
  const { t } = useTranslation("finances");

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: { onSubmit: categoryFormSchema },
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
        <FieldGroup>
          <form.AppField name="name">
            {(field) => (
              <field.TextField autoFocus label={t("categories.name")} />
            )}
          </form.AppField>
          <form.Field name="icon">
            {(field) => (
              <div className="flex flex-col gap-2">
                <FieldLabel>{t("categories.icon")}</FieldLabel>
                <ToggleGroup
                  aria-label={t("categories.icon")}
                  className="flex-wrap"
                  onValueChange={([value = ""]) => {
                    if (isCategoryIcon(value)) {
                      field.handleChange(value);
                    }
                  }}
                  spacing={1.5}
                  value={[field.state.value]}
                  variant="outline"
                >
                  {CATEGORY_ICONS.map((icon) => (
                    <ToggleGroupItem aria-label={icon} key={icon} value={icon}>
                      {createElement(CATEGORY_ICON_COMPONENTS[icon])}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            )}
          </form.Field>
        </FieldGroup>
      </FormSection>
    </DialogForm>
  );
};
