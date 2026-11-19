import { useTranslation } from "react-i18next";

const FUELS = [
  "petrol",
  "diesel",
  "lpg",
  "hybrid",
  "electric",
  "other",
] as const;

type Fuel = (typeof FUELS)[number];

const isFuel = (value: string): value is Fuel =>
  FUELS.some((fuel) => fuel === value);

/** Translated fuel type; free text from older data is shown as entered. */
export const useFuelLabel = () => {
  const { t } = useTranslation("garage");

  return (value: string | null): string | null => {
    if (value === null || !isFuel(value)) {
      return value;
    }

    return t(`carForm.fuel.${value}`);
  };
};
