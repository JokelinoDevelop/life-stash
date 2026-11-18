import { useTranslation } from "react-i18next";

import { useAppForm } from "@/components/form/form-hook";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldGroup } from "@/components/ui/field";
import { Label } from "@/components/ui/label";

import type { CatalogItem } from "../../catalog.queries";
import { packageFormSchema } from "./schema";
import type { PackageFormValues } from "./schema";

const ItemChecklist = ({
  items,
  value,
  onChange,
}: {
  items: CatalogItem[];
  value: string[];
  onChange: (next: string[]) => void;
}) => {
  const { t } = useTranslation("garageCatalog");

  const selected = new Set(value);

  const toggle = (itemId: string, checked: boolean) => {
    onChange(
      checked ? [...value, itemId] : value.filter((id) => id !== itemId)
    );
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">
        {t("packages.items")}
      </legend>
      {items.length === 0 && (
        <p className="text-muted-foreground text-sm">{t("packages.noItems")}</p>
      )}
      <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
        {items.map((item) => (
          <div className="flex items-center gap-2" key={item.id}>
            <Checkbox
              checked={selected.has(item.id)}
              id={`package-item-${item.id}`}
              onCheckedChange={(next) => {
                toggle(item.id, next === true);
              }}
            />
            <Label htmlFor={`package-item-${item.id}`}>{item.name}</Label>
          </div>
        ))}
      </div>
    </fieldset>
  );
};

export const PackageForm = ({
  defaultValues,
  items,
  onSubmit,
}: {
  defaultValues: PackageFormValues;
  items: CatalogItem[];
  onSubmit: (values: PackageFormValues) => Promise<void>;
}) => {
  const { t } = useTranslation("garageCatalog");
  const { t: tc } = useTranslation();

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: { onSubmit: packageFormSchema },
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.AppField name="name">
          {(field) => (
            <field.TextField
              label={t("packages.name")}
              placeholder={t("packages.namePlaceholder")}
            />
          )}
        </form.AppField>
        <form.Field name="itemIds">
          {(field) => (
            <ItemChecklist
              items={items}
              onChange={field.handleChange}
              value={field.state.value}
            />
          )}
        </form.Field>
        <form.AppField name="notes">
          {(field) => (
            <field.TextareaField label={tc("fields.notes")} optional />
          )}
        </form.AppField>
      </FieldGroup>
      <form.AppForm>
        <form.SubmitButton className="self-end" />
      </form.AppForm>
    </form>
  );
};
