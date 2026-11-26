import { useTranslation } from "react-i18next";

import { DialogForm, FormSection } from "@/components/form/dialog-form";
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

/** Bank name, address and country, IBAN and SWIFT: where clients pay you. */
const ProfileBankFields = withForm({
  defaultValues: businessProfileToFormValues(null),
  render: function ProfileBankFieldsRender({ form }) {
    const { t } = useTranslation("finances");

    return (
      <FormSection>
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
              {(field) => (
                <field.TextField label={t("profile.iban")} optional />
              )}
            </form.AppField>
            <form.AppField name="swift">
              {(field) => (
                <field.TextField label={t("profile.swift")} optional />
              )}
            </form.AppField>
          </div>
        </FieldGroup>
      </FormSection>
    );
  },
});

/** Settings › Finances › Your details: who issues your invoices and where to pay. */
export const BusinessProfileForm = ({
  onCancel,
  onSaved,
  profile,
}: {
  onCancel: () => void;
  /** After a successful save, e.g. to close the dialog. */
  onSaved?: () => void;
  profile: BusinessProfile | null;
}) => {
  const { t } = useTranslation("finances");
  const save = useSaveBusinessProfile();

  const form = useAppForm({
    defaultValues: businessProfileToFormValues(profile),
    onSubmit: async ({ value }) => {
      await save.mutateAsync(businessProfileFormToRequest(value));
      onSaved?.();
    },
    validators: { onSubmit: businessProfileFormSchema },
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
        <form.Subscribe selector={(state) => state.values}>
          {(values) => <ProfileHeaderPreview values={values} />}
        </form.Subscribe>
      </FormSection>
      <FormSection>
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
              {(field) => (
                <field.TextField label={t("profile.taxId")} optional />
              )}
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
      </FormSection>
      <ProfileBankFields form={form} />
      <FormSection>
        <FieldGroup>
          <ProfileVatFields form={form} />
        </FieldGroup>
      </FormSection>
    </DialogForm>
  );
};
