import { currenciesNeedingRates } from "@shared/domain/exchange";
import type { ExchangeRates } from "@shared/domain/exchange";
import type { Currency } from "@shared/domain/money";
import { useTranslation } from "react-i18next";

import { FieldErrors } from "@/components/form/field-errors";
import { useAppForm } from "@/components/form/form-hook";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { SettingsRow } from "@/modules/settings/settings-section";

import { useUpdateFinanceSettings } from "../finance-settings.queries";
import { exchangeRatesFormToRequest, ratesToFormValues } from "./mapper";
import { exchangeRatesFormSchema } from "./schema";

/**
 * One row per currency other than the main one: "1 EUR = [61.5] MKD". A rate
 * saves when you leave its field (or press Enter), like the other settings.
 */
export const ExchangeRatesForm = ({
  main,
  rates,
}: {
  main: Currency;
  rates: ExchangeRates;
}) => {
  const { t } = useTranslation("finances");
  const update = useUpdateFinanceSettings();

  const form = useAppForm({
    defaultValues: ratesToFormValues(rates, main),
    onSubmit: async ({ formApi, value }) => {
      await update.mutateAsync(exchangeRatesFormToRequest(value, main));
      // What was saved becomes the new baseline, so leaving again doesn't re-save.
      formApi.reset(value);
    },
    validators: { onSubmit: exchangeRatesFormSchema },
  });

  const saveIfChanged = () => {
    if (!form.state.isDefaultValue) {
      void form.handleSubmit();
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        saveIfChanged();
      }}
    >
      {currenciesNeedingRates(main).map((currency) => (
        <form.Field key={currency} name={currency}>
          {(field) => (
            <div className="border-divider border-b last:border-0">
              <SettingsRow
                htmlFor={`rate-${currency}`}
                label={t("rates.oneUnit", { currency })}
              >
                <InputGroup className="w-36">
                  <InputGroupInput
                    aria-invalid={field.state.meta.errors.length > 0}
                    className="text-right"
                    enterKeyHint="done"
                    id={`rate-${currency}`}
                    inputMode="decimal"
                    name={field.name}
                    onBlur={() => {
                      field.handleBlur();
                      saveIfChanged();
                    }}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                    }}
                    placeholder="—"
                    value={field.state.value}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>{main}</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </SettingsRow>
              {field.state.meta.errors.length > 0 && (
                <div className="px-4 pb-2">
                  <FieldErrors errors={field.state.meta.errors} show />
                </div>
              )}
            </div>
          )}
        </form.Field>
      ))}
      {/* Enter in a field submits; the button itself stays out of sight. */}
      <button className="sr-only" tabIndex={-1} type="submit">
        {t("rates.title")}
      </button>
    </form>
  );
};
