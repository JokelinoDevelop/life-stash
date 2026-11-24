import { gramsToKg } from "@shared/domain/fitness/weight";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useFormat } from "@/lib/format";

/** Body weight for display: "81.4 kg", and signed changes "−0.6 kg" (kg only). */
export const useWeightFormat = () => {
  const { t } = useTranslation("fitness");
  const { locale } = useFormat();

  return useMemo(() => {
    const number = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    });

    const signed = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
      signDisplay: "exceptZero",
    });

    return {
      change: (grams: number | null): string =>
        grams === null ? "—" : `${signed.format(gramsToKg(grams))} ${t("kg")}`,
      kg: (grams: number | null): string =>
        grams === null ? "—" : `${number.format(gramsToKg(grams))} ${t("kg")}`,
      /** The number alone, for chart axes. */
      value: (kg: number): string => number.format(kg),
    };
  }, [locale, t]);
};
