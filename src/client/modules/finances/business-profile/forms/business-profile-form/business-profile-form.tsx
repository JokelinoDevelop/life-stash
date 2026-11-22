import { useTranslation } from "react-i18next";

import { useAppForm, withForm } from "@/components/form/form-hook";
import { FieldGroup } from "@/components/ui/field";

import { useSaveBusinessProfile } from "../../business-profile.queries";
import type { BusinessProfile } from "../../business-profile.queries";
import { ProfileHeaderPreview } from "../../profile-header-preview";
import {
  businessProfileFormToRequest,
  businessProfileToFormValues,
} from "./mapper";
import { businessProfileFormSchema } from "./schema";

/** VAT registration, its default rate (only when registered) and the footer note. */
const ProfileVatFields = withForm({
  defaultValues: businessProfileToFormValues(null),
  render: function ProfileVatFieldsRender({ form }) {
    const { t } = useTranslation("finances");

    return (
      <>
        <form.AppField name="vatRegistered">
          {(field) => (
            <field.SwitchField
              description={t("profile.vatRegisteredHint")}
              label={t("profile.vatRegistered")}
            />
          )}
        </form.AppField>
        <form.Subscribe selector={(state) => state.values.vatRegistered}>
          {(registered) =>
            registered && (
              <form.AppField name="defaultVatRate">
                {(field) => (
                  <field.TextField
                    inputMode="decimal"
                    label={t("profile.defaultVatRate")}
                    suffix="%"
                  />
                )}
              </form.AppField>
            )
          }
        </form.Subscribe>
        <form.AppField name="footerNote">
          {(field) => (
            <field.TextField
              description={t("profile.footerNoteHint")}
              label={t("profile.footerNote")}
              optional
              placeholder={t("profile.footerNotePlaceholder")}
            />
          )}
        </form.AppField>
      </>
    );
  },
});

/** Settings › Finances › Your details: who issues your invoices and where to pay. */
export const BusinessProfileForm = ({
  profile,
}: {
  profile: BusinessProfile | null;
}) => {
  const { t } = useTranslation("finances");
  const save = useSaveBusinessProfile();

  const form = useAppForm({
    defaultValues: businessProfileToFormValues(profile),
    onSubmit: async ({ value }) => {
      await save.mutateAsync(businessProfileFormToRequest(value));
    },
    validators: { onSubmit: businessProfileFormSchema },
  });

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Subscribe selector={(state) => state.values}>
        {(values) => <ProfileHeaderPreview values={values} />}
      </form.Subscribe>
      <FieldGroup>
        <form.AppField name="name">
          {(field) => (
            <field.TextField
              autoComplete="organization"
              description={t("profile.nameHint")}
              label={t("profile.name")}
            />
          )}
        </form.AppField>
        <form.AppField name="address">
          {(field) => (
            <field.TextareaField
              label={t("profile.address")}
              optional
              placeholder={t("profile.addressPlaceholder")}
            />
          )}
        </form.AppField>
        <div className="grid gap-4 sm:grid-cols-2">
          <form.AppField name="taxId">
            {(field) => <field.TextField label={t("profile.taxId")} optional />}
          </form.AppField>
          <form.AppField name="companyId">
            {(field) => (
              <field.TextField label={t("profile.companyId")} optional />
            )}
          </form.AppField>
          <form.AppField name="email">
            {(field) => (
              <field.TextField
                autoComplete="email"
                inputMode="email"
                label={t("profile.email")}
                optional
              />
            )}
          </form.AppField>
          <form.AppField name="phone">
            {(field) => (
              <field.TextField
                autoComplete="tel"
                inputMode="tel"
                label={t("profile.phone")}
                optional
              />
            )}
          </form.AppField>
        </div>
      </FieldGroup>
      <FieldGroup>
        <form.AppField name="bankName">
          {(field) => (
            <field.TextField label={t("profile.bankName")} optional />
          )}
        </form.AppField>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <form.AppField name="bankAddress">
            {(field) => (
              <field.TextField label={t("profile.bankAddress")} optional />
            )}
          </form.AppField>
          <form.AppField name="bankCountry">
            {(field) => (
              <field.TextField label={t("profile.bankCountry")} optional />
            )}
          </form.AppField>
        </div>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <form.AppField name="iban">
            {(field) => <field.TextField label={t("profile.iban")} optional />}
          </form.AppField>
          <form.AppField name="swift">
            {(field) => <field.TextField label={t("profile.swift")} optional />}
          </form.AppField>
        </div>
      </FieldGroup>
      <FieldGroup>
        <ProfileVatFields form={form} />
      </FieldGroup>
      <form.AppForm>
        <form.SubmitButton className="self-end" />
      </form.AppForm>
    </form>
  );
};
