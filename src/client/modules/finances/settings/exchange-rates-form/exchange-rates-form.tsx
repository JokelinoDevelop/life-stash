import { currenciesNeedingRates } from "@shared/domain/exchange";
import type { ExchangeRates } from "@shared/domain/exchange";
import type { Currency } from "@shared/domain/money";
import { useTranslation } from "react-i18next";

import { useAppForm } from "@/components/form/form-hook";
import { FieldGroup } from "@/components/ui/field";

import { useUpdateFinanceSettings } from "../finance-settings.queries";
import { exchangeRatesFormToRequest, ratesToFormValues } from "./mapper";
import { exchangeRatesFormSchema } from "./schema";

/** "1 EUR = [61.5] MKD" for each currency other than the main one. */
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
    onSubmit: async ({ value }) => {
      await update.mutateAsync(exchangeRatesFormToRequest(value, main));
    },
    validators: { onSubmit: exchangeRatesFormSchema },
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
        <div className="grid gap-4 sm:grid-cols-2">
          {currenciesNeedingRates(main).map((currency) => (
            <form.AppField key={currency} name={currency}>
              {(field) => (
                <field.TextField
                  inputMode="decimal"
                  label={t("rates.oneUnit", { currency })}
                  optional
                  suffix={main}
                />
              )}
            </form.AppField>
          ))}
        </div>
      </FieldGroup>
      <form.AppForm>
        <form.SubmitButton className="self-end" />
      </form.AppForm>
    </form>
  );
};
