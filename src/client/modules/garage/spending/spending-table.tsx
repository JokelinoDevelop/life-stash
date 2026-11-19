import { useTranslation } from "react-i18next";

import { Panel } from "@/components/app/list-section";
import { useFormat } from "@/lib/format";

import type { CarSpendingYear } from "./spending.queries";

const cellClass = "px-4 py-2.5 text-right tabular-nums md:py-2";

export const SpendingTable = ({ years }: { years: CarSpendingYear[] }) => {
  const { t } = useTranslation("garageSpending");
  const format = useFormat();

  return (
    <Panel className="p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-md text-sm">
          <thead className="bg-background text-muted-foreground">
            <tr className="border-divider border-b">
              <th
                className="px-4 py-2.5 text-left font-medium md:py-2"
                scope="col"
              >
                {t("columns.year")}
              </th>
              <th className={cellClass} scope="col">
                {t("columns.maintenance")}
              </th>
              <th className={cellClass} scope="col">
                {t("columns.repair")}
              </th>
              <th className={cellClass} scope="col">
                {t("columns.other")}
              </th>
              <th className={cellClass} scope="col">
                {t("columns.total")}
              </th>
            </tr>
          </thead>
          <tbody>
            {years.map((year) => (
              <tr
                className="border-divider border-b last:border-0"
                key={`${year.year}-${year.currency}`}
              >
                <th
                  className="px-4 py-2.5 text-left font-medium md:py-2"
                  scope="row"
                >
                  {year.year}
                </th>
                <td className={cellClass}>
                  {format.money(year.maintenanceMinor, year.currency)}
                </td>
                <td className={cellClass}>
                  {format.money(year.repairMinor, year.currency)}
                </td>
                <td className={cellClass}>
                  {format.money(year.otherMinor, year.currency)}
                </td>
                <td className={`${cellClass} font-semibold`}>
                  {format.money(
                    year.maintenanceMinor + year.repairMinor + year.otherMinor,
                    year.currency
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
};
