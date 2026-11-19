import { useTranslation } from "react-i18next";

import { useFormat } from "@/lib/format";

import type { CarSpendingYear } from "../spending/spending.queries";
import { useFuelLabel } from "./fuel-label";
import { SpendingBreakdown } from "./spending-breakdown";
import { yearTotal } from "./spending-total";

interface CarDetails {
  fuelType: string | null;
  make: string | null;
  model: string | null;
  plate: string | null;
  vin: string | null;
  year: number | null;
}

const Prop = ({ label, value }: { label: string; value: string | null }) =>
  value === null || value === "" ? null : (
    <div className="grid min-h-7 grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate tabular-nums">{value}</dd>
    </div>
  );

const Heading = ({ children }: { children: string }) => (
  <h2 className="text-muted-foreground mb-1.5 text-xs font-medium">
    {children}
  </h2>
);

/** Desktop overview: details, this year's spending and averages beside the lists. */
export const CarSidePanel = ({
  averagePerMonth,
  car,
  costPerDistance,
  spending,
  year,
}: {
  averagePerMonth: string | null;
  car: CarDetails;
  costPerDistance: string | null;
  spending: CarSpendingYear | undefined;
  year: number;
}) => {
  const { t } = useTranslation("garage");
  const { t: tc } = useTranslation();
  const format = useFormat();
  const fuelLabel = useFuelLabel();

  return (
    <aside className="border-divider hidden w-72 shrink-0 flex-col gap-6 border-l p-5 lg:flex">
      <section>
        <Heading>{t("overview.details")}</Heading>
        <dl>
          <Prop label={t("carForm.plate")} value={car.plate} />
          <Prop label={t("carForm.make")} value={car.make} />
          <Prop label={t("carForm.model")} value={car.model} />
          <Prop
            label={t("carForm.year")}
            value={car.year === null ? null : String(car.year)}
          />
          <Prop label={t("carForm.fuelType")} value={fuelLabel(car.fuelType)} />
          <Prop label={t("carForm.vin")} value={car.vin} />
        </dl>
      </section>
      {spending !== undefined && (
        <section className="border-divider border-t pt-5">
          <Heading>{t("overview.spentIn", { year })}</Heading>
          <p className="text-lg font-semibold tracking-tight tabular-nums">
            {format.money(yearTotal(spending), spending.currency)}
          </p>
          <SpendingBreakdown dense year={spending} />
        </section>
      )}
      <section className="border-divider border-t pt-5">
        <Heading>{t("overview.averages")}</Heading>
        <dl>
          <Prop label={t("overview.perMonth")} value={averagePerMonth} />
          <Prop
            label={t("overview.costPerDistance", {
              unit: tc(`units.${format.unit}`),
            })}
            value={costPerDistance}
          />
        </dl>
      </section>
    </aside>
  );
};
