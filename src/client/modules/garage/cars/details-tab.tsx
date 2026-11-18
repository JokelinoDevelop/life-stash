import type { DatePrecision } from "@shared/domain/dates";
import type { Currency } from "@shared/domain/money";
import { useTranslation } from "react-i18next";

import { Card, CardContent } from "@/components/ui/card";
import { useFormat } from "@/lib/format";

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

export const DetailsTab = ({ car }: { car: CarDetails }) => {
  const { t } = useTranslation("garage");
  const { t: tc } = useTranslation();
  const format = useFormat();

  const fuelLabel = (value: string | null): string | null => {
    if (value === null || !isFuel(value)) {
      return value;
    }

    return t(`carForm.fuel.${value}`);
  };

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

  return (
    <Card>
      <CardContent>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {rows.flatMap(([label, value]) =>
            value === null
              ? []
              : [
                  <div className="flex flex-col" key={label}>
                    <dt className="text-muted-foreground text-sm">{label}</dt>
                    <dd className="whitespace-pre-wrap">{value}</dd>
                  </div>,
                ]
          )}
        </dl>
      </CardContent>
    </Card>
  );
};
