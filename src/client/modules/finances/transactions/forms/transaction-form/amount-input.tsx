import { CURRENCIES } from "@shared/domain/money";
import type { Currency } from "@shared/domain/money";
import { useTranslation } from "react-i18next";

import { FieldErrors } from "@/components/form/field-errors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { useCurrencySymbol } from "../../../money";

interface AmountInputProps {
  amount: string;
  currency: Currency;
  income: boolean;
  invalid: boolean;
  errors: unknown[];
  centered?: boolean;
  onAmountChange: (value: string) => void;
  onAmountBlur: () => void;
  onCurrencyChange: (value: Currency) => void;
}

const isCurrency = (value: string): value is Currency =>
  CURRENCIES.some((code) => code === value);

/** The big amount of the log dialog: symbol, a borderless number and the currency. */
export const AmountInput = ({
  amount,
  centered = false,
  currency,
  errors,
  income,
  invalid,
  onAmountBlur,
  onAmountChange,
  onCurrencyChange,
}: AmountInputProps) => {
  const { t } = useTranslation("finances");
  const symbol = useCurrencySymbol()(currency);

  const currencySelect = (
    <Select
      onValueChange={(value) => {
        if (isCurrency(value)) {
          onCurrencyChange(value);
        }
      }}
      value={currency}
    >
      <SelectTrigger
        aria-label={t("form.currency")}
        size={centered ? "default" : "chip"}
        variant={centered ? "ghost" : "default"}
      >
        {centered ? `${currency} · ${t("form.tapToChange")}` : currency}
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((code) => (
          <SelectItem key={code} value={code}>
            {code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className={cn("flex flex-col", centered && "items-center")}>
      <label
        className={cn(
          "text-muted-foreground text-xs font-medium",
          centered && "sr-only"
        )}
        htmlFor="amount"
      >
        {t("form.amount")}
      </label>
      <div
        className={cn(
          "mt-0.5 flex items-baseline gap-1.5",
          centered && "justify-center"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "text-muted-foreground font-semibold",
            centered ? "text-4xl" : "text-3xl"
          )}
        >
          {income ? `+${symbol}` : symbol}
        </span>
        <input
          aria-invalid={invalid}
          autoComplete="off"
          className={cn(
            "placeholder:text-muted-foreground/50 min-w-0 border-0 bg-transparent p-0 font-semibold tracking-tight tabular-nums outline-none",
            centered
              ? "field-sizing-content max-w-full text-center text-5xl"
              : "flex-1 text-3xl"
          )}
          id="amount"
          inputMode="decimal"
          name="amount"
          onBlur={onAmountBlur}
          onChange={(event) => {
            onAmountChange(event.target.value);
          }}
          placeholder="0.00"
          value={amount}
        />
        {!centered && currencySelect}
      </div>
      {centered && <div className="mt-1">{currencySelect}</div>}
      <FieldErrors errors={errors.slice(0, 1)} show={invalid} />
    </div>
  );
};
