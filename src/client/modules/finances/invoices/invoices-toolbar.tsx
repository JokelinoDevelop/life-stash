import { CalendarDays, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
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
    <div className="md:border-divider -mx-4 flex scrollbar-none items-center gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:border-b md:px-5 md:py-2">
      <ToggleGroup
        aria-label={t("invoices.filter.label")}
        className="shrink-0"
        onValueChange={([value]) => {
          if (value === "unpaid" || value === "paid") {
            onChange({ status: value });
          } else if (value === ALL) {
            onChange({ status: null });
          }
        }}
        size="segmented"
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
      <Select
        onValueChange={(value) => {
          onChange({ client: value === ALL ? null : value });
        }}
        value={search.client ?? ALL}
      >
        <SelectTrigger aria-label={t("invoices.form.client")} size="chip">
          <Users />
          {client?.name ?? t("invoices.allClients")}
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false}>
          <SelectItem value={ALL}>{t("invoices.allClients")}</SelectItem>
          {clients.map((row) => (
            <SelectItem key={row.id} value={row.id}>
              {row.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        onValueChange={(value) => {
          const picked = Number(value);

          onChange({ year: picked === currentYear ? null : picked });
        }}
        value={String(year)}
      >
        <SelectTrigger aria-label={t("transactions.year")} size="chip">
          <CalendarDays />
          {year}
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false}>
          {years.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
