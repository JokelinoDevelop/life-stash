import type { Currency } from "@shared/domain/money";
import { toMajor } from "@shared/domain/money";

import { moneyFormatOptions, useFormat } from "@/lib/format";
import { splitMoneyParts } from "@/lib/money-parts";
import { cn } from "@/lib/utils";

const formats = new Map<string, Intl.NumberFormat>();

const formatterFor = (
  locale: string,
  currency: Currency,
  variant: "default" | "ledger"
): Intl.NumberFormat => {
  const key = `${locale}:${currency}:${variant}`;
  const cached = formats.get(key);

  if (cached !== undefined) {
    return cached;
  }

  const digits = currency === "MKD" ? 0 : 2;

  const created = new Intl.NumberFormat(
    locale,
    variant === "ledger"
      ? {
          currency,
          maximumFractionDigits: digits,
          minimumFractionDigits: digits,
          style: "currency",
        }
      : moneyFormatOptions(currency)
  );

  formats.set(key, created);

  return created;
};

/**
 * An amount whose currency (code or symbol) is set smaller and lighter than the
 * figure, so headline numbers and long ledgers read as numbers first. On
 * desktop (`phoneOnly`, the default) it renders exactly like plain text.
 * `ledger` always shows cents (whole denars), like `useLedgerMoney`.
 */
export const Money = ({
  amountMinor,
  className,
  currency,
  phoneOnly = true,
  sign,
  variant = "default",
}: {
  amountMinor: number;
  className?: string;
  currency?: Currency;
  /** Style the currency on phones only (desktop keeps one weight). */
  phoneOnly?: boolean;
  /** Prefix such as "+" (income) or "−" (spending); the amount is then shown unsigned. */
  sign?: "+" | "−";
  variant?: "default" | "ledger";
}) => {
  const format = useFormat();
  const code = currency ?? format.currency;

  const value = toMajor(
    sign === undefined ? amountMinor : Math.abs(amountMinor)
  );

  const parts = splitMoneyParts(
    formatterFor(format.locale, code, variant).formatToParts(value)
  );

  return (
    <span className={cn("whitespace-nowrap tabular-nums", className)}>
      {sign}
      {parts.map((part, index) =>
        part.kind === "currency" ? (
          <span
            className={cn(
              phoneOnly ? "max-md:font-medium" : "font-medium",
              phoneOnly ? "max-md:money-code" : "money-code"
            )}
            // oxlint-disable-next-line react/no-array-index-key -- parts have no identity
            key={index}
          >
            {part.text}
          </span>
        ) : (
          // oxlint-disable-next-line react/no-array-index-key -- parts have no identity
          <span key={index}>{part.text}</span>
        )
      )}
    </span>
  );
};
