import { CURRENCIES } from "@shared/domain/money";
import { useTranslation } from "react-i18next";

import { withForm } from "@/components/form/form-hook";
import { FieldGroup } from "@/components/ui/field";
import { useFormat } from "@/lib/format";

import { carFormDefaults } from "./mapper";

const FUEL_TYPES = [
  "petrol",
  "diesel",
  "lpg",
  "hybrid",
  "electric",
  "other",
] as const;

/** Only used to type the shared form sections. */
const CAR_FORM_TEMPLATE = carFormDefaults({
  currency: "MKD",
  today: "2000-01-01",
  unit: "km",
});

export const CarIdentityFields = withForm({
  defaultValues: CAR_FORM_TEMPLATE,
  render: function CarIdentityFieldsRender({ form }) {
    const { t } = useTranslation("garage");

    return (
      <FieldGroup>
        <form.AppField name="name">
          {(field) => (
            <field.TextField
              autoFocus
              label={t("carForm.name")}
              placeholder={t("carForm.namePlaceholder")}
            />
          )}
        </form.AppField>
        <div className="grid gap-4 sm:grid-cols-2">
          <form.AppField name="make">
            {(field) => <field.TextField label={t("carForm.make")} optional />}
          </form.AppField>
          <form.AppField name="model">
            {(field) => <field.TextField label={t("carForm.model")} optional />}
          </form.AppField>
          <form.AppField name="year">
            {(field) => (
              <field.TextField
                inputMode="numeric"
                label={t("carForm.year")}
                optional
              />
            )}
          </form.AppField>
          <form.AppField name="fuelType">
            {(field) => (
              <field.SelectField
                label={t("carForm.fuelType")}
                optional
                options={FUEL_TYPES.map((fuel) => ({
                  label: t(`carForm.fuel.${fuel}`),
                  value: fuel,
                }))}
              />
            )}
          </form.AppField>
          <form.AppField name="plate">
            {(field) => <field.TextField label={t("carForm.plate")} optional />}
          </form.AppField>
          <form.AppField name="color">
            {(field) => <field.TextField label={t("carForm.color")} optional />}
          </form.AppField>
        </div>
        <form.AppField name="vin">
          {(field) => <field.TextField label={t("carForm.vin")} optional />}
        </form.AppField>
      </FieldGroup>
    );
  },
});

export const CarPurchaseFields = withForm({
  defaultValues: CAR_FORM_TEMPLATE,
  render: function CarPurchaseFieldsRender({ form }) {
    const { t } = useTranslation("garage");
    const { t: tc } = useTranslation();
    const { unit } = useFormat();

    return (
      <FieldGroup>
        <form.AppField name="hasPurchaseDate">
          {(field) => <field.SwitchField label={t("carForm.purchaseDate")} />}
        </form.AppField>
        <form.Subscribe selector={(state) => state.values.hasPurchaseDate}>
          {(hasPurchaseDate) =>
            hasPurchaseDate && (
              <form.AppField name="purchaseDate">
                {(field) => (
                  <field.PartialDateField label={t("carForm.purchaseDate")} />
                )}
              </form.AppField>
            )
          }
        </form.Subscribe>
        <form.AppField name="purchaseOdometer">
          {(field) => (
            <field.TextField
              inputMode="numeric"
              label={t("carForm.purchaseOdometer")}
              optional
              suffix={tc(`units.${unit}`)}
            />
          )}
        </form.AppField>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <form.AppField name="purchasePrice">
            {(field) => (
              <field.TextField
                inputMode="decimal"
                label={t("carForm.purchasePrice")}
                optional
              />
            )}
          </form.AppField>
          <form.AppField name="purchaseCurrency">
            {(field) => (
              <field.SelectField
                label={tc("fields.currency")}
                options={CURRENCIES.map((code) => ({
                  label: code,
                  value: code,
                }))}
              />
            )}
          </form.AppField>
        </div>
        <form.AppField name="notes">
          {(field) => (
            <field.TextareaField label={tc("fields.notes")} optional />
          )}
        </form.AppField>
      </FieldGroup>
    );
  },
});
