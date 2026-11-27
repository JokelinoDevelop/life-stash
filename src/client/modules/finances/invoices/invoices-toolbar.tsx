import { CalendarDays, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FilterBar, FilterSelect } from "@/components/app/filter-bar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import type { ClientListItem } from "../clients/clients.queries";
import type { InvoicesSearch, InvoicesSearchPatch } from "./invoices-search";

const ALL = "all";
const YEARS_BACK = 5;

/** Status (All / Unpaid / Paid), client and year; the P hint on desktop. */
export const InvoicesToolbar = ({
  clients,
  currentYear,
  onChange,
  search,
}: {
  clients: readonly ClientListItem[];
  currentYear: number;
  onChange: (patch: InvoicesSearchPatch) => void;
  search: InvoicesSearch;
}) => {
  const { t } = useTranslation("finances");
  const year = search.year ?? currentYear;
  const client = clients.find((row) => row.id === search.client);

  const years = Array.from(
    { length: YEARS_BACK + 1 },
    (_, index) => currentYear - index
  );

  return (
    <FilterBar
      status={
        <ToggleGroup
          aria-label={t("invoices.filter.label")}
          className="w-full shrink-0 md:w-fit"
          onValueChange={([value]) => {
            if (value === "unpaid" || value === "paid") {
              onChange({ status: value });
            } else if (value === ALL) {
              onChange({ status: null });
            }
          }}
          size="segmented-block"
          spacing={0.5}
          value={[search.status ?? ALL]}
          variant="segmented"
        >
          <ToggleGroupItem value={ALL}>
            {t("invoices.filter.all")}
          </ToggleGroupItem>
          <ToggleGroupItem value="unpaid">
            {t("invoices.filter.unpaid")}
          </ToggleGroupItem>
          <ToggleGroupItem value="paid">
            {t("invoices.filter.paid")}
          </ToggleGroupItem>
        </ToggleGroup>
      }
    >
      <FilterSelect
        display={client?.name ?? t("invoices.allClients")}
        emptyValue={ALL}
        groups={[
          { options: [{ label: t("invoices.allClients"), value: ALL }] },
          {
            options: clients.map((row) => ({ label: row.name, value: row.id })),
          },
        ]}
        icon={<Users />}
        label={t("invoices.form.client")}
        onValueChange={(value) => {
          onChange({ client: value === ALL ? null : value });
        }}
        value={search.client ?? ALL}
      />
      <FilterSelect
        display={String(year)}
        emptyValue={String(currentYear)}
        groups={[
          {
            options: years.map((option) => ({
              label: String(option),
              value: String(option),
            })),
          },
        ]}
        icon={<CalendarDays />}
        label={t("transactions.year")}
        onValueChange={(value) => {
          const picked = Number(value);

          onChange({ year: picked === currentYear ? null : picked });
        }}
        value={String(year)}
      />
    </FilterBar>
  );
};
