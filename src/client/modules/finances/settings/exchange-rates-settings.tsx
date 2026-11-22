import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { ErrorState, LoadingState } from "@/components/app/states";
import { usePreferences } from "@/lib/session";
import { SettingsSection } from "@/modules/settings/settings-section";

import { ExchangeRatesForm } from "./exchange-rates-form/exchange-rates-form";
import { financeSettingsQuery } from "./finance-settings.queries";

/** Settings › Finances › Exchange rates: lets headline totals add up in the main currency. */
export const ExchangeRatesSettings = () => {
  const { t } = useTranslation("finances");
  const settings = useQuery(financeSettingsQuery);
  const preferences = usePreferences();
  const main = preferences.data?.currency;

  let body = <LoadingState rows={2} variant="rows" />;

  if (settings.isError) {
    body = (
      <ErrorState
        error={settings.error}
        onRetry={() => {
          void settings.refetch();
        }}
      />
    );
  } else if (settings.data !== undefined && main !== undefined) {
    body = (
      // Remount when the main currency changes so the fields re-derive.
      <ExchangeRatesForm
        key={main}
        main={main}
        rates={settings.data.exchangeRates}
      />
    );
  }

  return (
    <SettingsSection
      description={t("rates.description")}
      title={t("rates.title")}
    >
      {body}
    </SettingsSection>
  );
};
