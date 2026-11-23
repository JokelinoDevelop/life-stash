import type { DatePrecision } from "@shared/domain/dates";
import type { Currency } from "@shared/domain/money";
import { useTranslation } from "react-i18next";

import { useFormat } from "@/lib/format";

import { useFuelLabel } from "./fuel-label";

interface CarDetails {
  make: string | null;
  model: string | null;
  year: number | null;
  plate: string | null;
  vin: string | null;
  fuelType: string | null;
  color: string | null;
  purchaseDate: string | null;
  purchaseDatePrecision: DatePrecision | null;
  purchaseOdometerKm: number | null;
  purchasePriceMinor: number | null;
  purchaseCurrency: Currency | null;
  soldDate: string | null;
  notes: string | null;
}

export const DetailsTab = ({ car }: { car: CarDetails }) => {
  const { t } = useTranslation("garage");
  const { t: tc } = useTranslation();
  const format = useFormat();

  const fuelLabel = useFuelLabel();

  const fuel = fuelLabel(car.fuelType);

  const rows: [string, string | null][] = [
    [t("carForm.make"), car.make],
    [t("carForm.model"), car.model],
    [t("carForm.year"), car.year === null ? null : String(car.year)],
    [t("carForm.plate"), car.plate],
    [t("carForm.vin"), car.vin],
    [t("carForm.fuelType"), fuel],
    [t("carForm.color"), car.color],
    [
      t("carForm.purchaseDate"),
      car.purchaseDate === null
        ? null
        : format.date(car.purchaseDate, car.purchaseDatePrecision ?? "day"),
    ],
    [
      t("carForm.purchaseOdometer"),
      car.purchaseOdometerKm === null
        ? null
        : format.distance(car.purchaseOdometerKm),
    ],
    [
      t("carForm.purchasePrice"),
      car.purchasePriceMinor === null
        ? null
        : format.money(
            car.purchasePriceMinor,
            car.purchaseCurrency ?? format.currency
          ),
    ],
    [
      t("car.soldDate"),
      car.soldDate === null ? null : format.date(car.soldDate),
    ],
    [tc("fields.notes"), car.notes],
  ];

  const present = rows.filter(
    (row): row is [string, string] => row[1] !== null
  );

  return (
    <dl className="surface bg-card divide-divider divide-y overflow-hidden rounded-lg border">
      {present.map(([label, value]) => (
        <div
          className="flex flex-col gap-0.5 px-4 py-2.5 md:grid md:min-h-10 md:grid-cols-[12rem_minmax(0,1fr)] md:items-center md:gap-4 md:py-2"
          key={label}
        >
          <dt className="text-muted-foreground text-xs md:text-sm">{label}</dt>
          <dd className="break-words whitespace-pre-wrap tabular-nums">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
};
