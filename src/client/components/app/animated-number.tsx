import NumberFlow from "@number-flow/react";
import type { NumberFlowProps } from "@number-flow/react";
import { toMajor } from "@shared/domain/money";
import type { Currency, MoneyTotal } from "@shared/domain/money";
import { kmToDisplay } from "@shared/domain/units";
import { useEffect, useMemo, useState } from "react";

import { moneyFormatOptions, useFormat } from "@/lib/format";

/*
 * Headline figures that roll to their new value when it changes (after a save
 * or an undo) instead of jumping. They render exactly like `useFormat` output
 * and stay still for `prefers-reduced-motion`.
 */

const TIMING = { duration: 450, easing: "cubic-bezier(0.2, 0, 0, 1)" };

/** Figures settle silently while a page loads (rates, refetches); only later changes roll. */
const SETTLE_MS = 1000;

const Flow = (props: NumberFlowProps) => {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSettled(true);
    }, SETTLE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const { format, locales, prefix = "", suffix = "", value } = props;

  const formatter = useMemo(
    () => new Intl.NumberFormat(locales, format),
    [format, locales]
  );

  const plain = `${prefix}${formatter.format(value)}${suffix}`;

  // Phones (2-column stats) show plain text: it truncates with "…", which the
  // animated element can't. From md up the 4-column panel has room to roll.
  return (
    <>
      <span className="md:hidden">{plain}</span>
      <NumberFlow
        animated={settled}
        className="hidden md:inline-block"
        spinTiming={TIMING}
        transformTiming={TIMING}
        {...props}
      />
    </>
  );
};

/** An amount in minor units, e.g. a stat's "€1,240". */
export const AnimatedMoney = ({
  amountMinor,
  currency,
}: {
  amountMinor: number;
  currency?: Currency;
}) => {
  const format = useFormat();
  const code = currency ?? format.currency;

  return (
    <Flow
      format={moneyFormatOptions(code)}
      locales={format.locale}
      value={toMajor(amountMinor)}
    />
  );
};

/** A distance stored in km, shown in the user's unit ("12,400 km"). */
export const AnimatedDistance = ({ km }: { km: number }) => {
  const format = useFormat();

  return (
    <Flow
      format={{ maximumFractionDigits: 0 }}
      locales={format.locale}
      suffix={` ${format.unitLabel}`}
      value={kmToDisplay(km, format.unit)}
    />
  );
};

/** A plain count ("3"). */
export const AnimatedCount = ({ value }: { value: number }) => {
  const format = useFormat();

  return <Flow locales={format.locale} value={value} />;
};

/**
 * Totals like `format.totals`. One currency rolls; several ("MKD 4,625,625 +
 * €53,750") stay plain text so a narrow stat can still truncate them with "…"
 * (the animated element can't take an ellipsis).
 */
export const AnimatedTotals = ({
  values,
}: {
  values: readonly MoneyTotal[];
}) => {
  const format = useFormat();
  const [only] = values;

  if (values.length !== 1 || only === undefined) {
    return <>{format.totals(values)}</>;
  }

  return (
    <AnimatedMoney amountMinor={only.amountMinor} currency={only.currency} />
  );
};
