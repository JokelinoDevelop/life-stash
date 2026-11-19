import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { DialogForm, FormSection } from "@/components/form/dialog-form";
import { useAppForm } from "@/components/form/form-hook";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldGroup } from "@/components/ui/field";

import type { CatalogItem } from "../../catalog.queries";
import { packageFormSchema } from "./schema";
import type { PackageFormValues } from "./schema";

/**
 * Every active item as a tappable row with a checkbox. Scrolls in its own box on
 * desktop; on phones the sheet scrolls instead (no scroll inside a scroll).
 */
const ItemPicker = ({
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

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">{t("packages.noItems")}</p>
    );
  }

  return (
    <ul
      aria-label={t("packages.items")}
      className="divide-divider divide-y rounded-lg border sm:grid sm:grid-cols-2 sm:divide-y-0 md:max-h-72 md:overflow-y-auto"
    >
      {items.map((item) => (
        <li key={item.id}>
          <label
            className="hover:bg-background flex min-h-11 cursor-pointer items-center gap-3 px-3 text-sm transition-colors md:min-h-9"
            htmlFor={`package-item-${item.id}`}
          >
            <Checkbox
              checked={selected.has(item.id)}
              id={`package-item-${item.id}`}
              onCheckedChange={(next) => {
                onChange(
                  next
                    ? [...value, item.id]
                    : value.filter((id) => id !== item.id)
                );
              }}
            />
            <span className="min-w-0 truncate">{item.name}</span>
          </label>
        </li>
      ))}
    </ul>
  );
};

export const PackageForm = ({
  defaultValues,
  footerStart,
  items,
  onCancel,
  onSubmit,
}: {
  defaultValues: PackageFormValues;
  /** Left side of the footer, e.g. Delete. */
  footerStart?: ReactNode;
  items: CatalogItem[];
  onCancel: () => void;
  onSubmit: (values: PackageFormValues) => Promise<void>;
}) => {
  const { t } = useTranslation("garageCatalog");
  const { t: tc } = useTranslation();

  // The package's items first, ordered once so rows don't move while ticking.
  const initial = new Set(defaultValues.itemIds);

  const ordered = [
    ...items.filter((item) => initial.has(item.id)),
    ...items.filter((item) => !initial.has(item.id)),
  ];

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: { onSubmit: packageFormSchema },
  });

  return (
    <DialogForm
      footer={
        <form.AppForm>
          <form.FormFooter onCancel={onCancel} start={footerStart} />
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
              <field.TextField
                label={t("packages.name")}
                placeholder={t("packages.namePlaceholder")}
              />
            )}
          </form.AppField>
          <form.AppField name="notes">
            {(field) => (
              <field.TextareaField label={tc("fields.notes")} optional />
            )}
          </form.AppField>
        </FieldGroup>
      </FormSection>
      <form.Field name="itemIds">
        {(field) => (
          <FormSection
            description={t("packages.itemsDescription")}
            title={
              <span className="flex justify-between gap-2">
                {t("packages.items")}
                <span className="text-muted-foreground font-normal tabular-nums">
                  {t("packages.selected", { count: field.state.value.length })}
                </span>
              </span>
            }
          >
            <ItemPicker
              items={ordered}
              onChange={field.handleChange}
              value={field.state.value}
            />
          </FormSection>
        )}
      </form.Field>
    </DialogForm>
  );
};
