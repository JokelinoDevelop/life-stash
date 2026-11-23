import { CURRENCIES } from "@shared/domain/money";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useAppForm } from "@/components/form/form-hook";
import { setLocale } from "@/i18n";
import { api, unwrap } from "@/lib/api";
import type { SuccessBody } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";

import { SettingsSection } from "../settings-section";
import { preferencesFormToRequest, preferencesToFormValues } from "./mapper";
import { preferencesFormSchema } from "./schema";

type Preferences = SuccessBody<
  Awaited<ReturnType<typeof api.settings.preferences.$get>>
>;

const timeZones = (current: string): string[] => {
  const zones = Intl.supportedValuesOf("timeZone");

  return zones.includes(current) ? zones : [current, ...zones];
};

export const PreferencesForm = ({
  preferences,
}: {
  preferences: Preferences;
}) => {
  const { t } = useTranslation("settings");
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();

  const form = useAppForm({
    defaultValues: preferencesToFormValues(preferences),
    onSubmit: async ({ value }) => {
      try {
        await unwrap(
          api.settings.preferences.$put({
            json: preferencesFormToRequest(value),
          })
        );
        await setLocale(value.locale);
        await queryClient.invalidateQueries({
          queryKey: queryKeys.preferences,
        });
        await queryClient.invalidateQueries({ queryKey: queryKeys.authStatus });
        toast.success(t("preferences.saved"));
      } catch (error) {
        toast.error(errorMessage(error));
      }
    },
    validators: { onSubmit: preferencesFormSchema },
  });

  return (
    <SettingsSection flush title={t("preferences.title")}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <div className="divide-divider divide-y">
          <form.AppField name="displayName">
            {(field) => (
              <field.TextField
                autoComplete="name"
                label={t("preferences.displayName")}
                layout="row"
              />
            )}
          </form.AppField>
          <form.AppField name="locale">
            {(field) => (
              <field.SelectField
                label={t("preferences.language")}
                layout="row"
                options={[
                  { label: t("languages.en"), value: "en" },
                  { label: t("languages.mk"), value: "mk" },
                ]}
              />
            )}
          </form.AppField>
          <form.AppField name="distanceUnit">
            {(field) => (
              <field.SelectField
                label={t("preferences.distanceUnit")}
                layout="row"
                options={[
                  { label: t("units.km"), value: "km" },
                  { label: t("units.mi"), value: "mi" },
                ]}
              />
            )}
          </form.AppField>
          <form.AppField name="currency">
            {(field) => (
              <field.SelectField
                label={t("preferences.currency")}
                layout="row"
                options={CURRENCIES.map((code) => ({
                  label: code,
                  value: code,
                }))}
              />
            )}
          </form.AppField>
          <form.AppField name="timeZone">
            {(field) => (
              <field.SelectField
                label={t("preferences.timeZone")}
                layout="row"
                options={timeZones(preferences.timeZone).map((zone) => ({
                  label: zone,
                  value: zone,
                }))}
              />
            )}
          </form.AppField>
          <form.AppField name="odometerNudgeWeeks">
            {(field) => (
              <field.TextField
                description={t("preferences.nudgeHelp")}
                inputMode="numeric"
                label={t("preferences.nudge")}
                layout="row"
                suffix={t("preferences.weeks")}
              />
            )}
          </form.AppField>
        </div>
        <div className="border-divider flex justify-end border-t p-3">
          <form.AppForm>
            <form.SubmitButton />
          </form.AppForm>
        </div>
      </form>
    </SettingsSection>
  );
};
