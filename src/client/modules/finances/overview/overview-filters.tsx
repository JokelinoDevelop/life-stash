import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Tag, Users, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui/select";
import { todayIso } from "@/lib/partial-date";

import { categoriesQuery } from "../categories/categories.queries";
import type { FinanceCategory } from "../categories/categories.queries";
import { useCategoryName } from "../categories/category-label";
import { clientsQuery } from "../clients/clients.queries";
import {
  hasOverviewFilters,
  LAST_12_MONTHS,
  NO_PERIOD,
  periodOf,
} from "./overview-search";
import type { OverviewPatch, OverviewSearch } from "./overview-search";
import { usePeriodLabel } from "./period-labels";
import { RangeDialog } from "./range-dialog";

const ANY = "any";
const ALL = "all";
const CUSTOM = "custom";

const PeriodFilter = ({
  onChange,
  search,
  years,
}: {
  onChange: (patch: OverviewPatch) => void;
  search: OverviewSearch;
  years: readonly number[];
}) => {
  const { t } = useTranslation("finances");
  const periodLabel = usePeriodLabel();
  const [customOpen, setCustomOpen] = useState(false);
  const today = todayIso();
  const period = periodOf(search, today);
  const custom = search.from !== undefined && period !== null;

  const currentYear = Number(today.slice(0, 4));

  const options = [...new Set([currentYear, ...years])].toSorted(
    (a, b) => b - a
  );

  let value = ALL;

  if (custom) {
    value = CUSTOM;
  } else if (search.year !== undefined) {
    value = String(search.year);
  } else if (search.range === LAST_12_MONTHS) {
    value = LAST_12_MONTHS;
  }

  return (
    <>
      <Select
        onValueChange={(next) => {
          if (next === CUSTOM) {
            setCustomOpen(true);
          } else if (next === LAST_12_MONTHS) {
            onChange({ ...NO_PERIOD, range: LAST_12_MONTHS });
          } else if (next === ALL) {
            onChange(NO_PERIOD);
          } else {
            onChange({ ...NO_PERIOD, year: Number(next) });
          }
        }}
        value={value}
      >
        <SelectTrigger aria-label={t("overview.period.label")} size="chip">
          <CalendarDays />
          {periodLabel(search)}
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false}>
          <SelectItem value={ALL}>{t("overview.period.all")}</SelectItem>
          <SelectItem value={LAST_12_MONTHS}>
            {t("overview.period.last12")}
          </SelectItem>
          <SelectSeparator />
          {options.map((year) => (
            <SelectItem key={year} value={String(year)}>
              {year === currentYear
                ? t("overview.period.thisYear", { year })
                : year}
            </SelectItem>
          ))}
          <SelectSeparator />
          <SelectItem value={CUSTOM}>{t("overview.period.custom")}</SelectItem>
        </SelectContent>
      </Select>
      {customOpen && (
        <RangeDialog
          initial={custom ? period : null}
          onApply={(range) => {
            onChange({ ...NO_PERIOD, ...range });
          }}
          onOpenChange={setCustomOpen}
          open={customOpen}
        />
      )}
    </>
  );
};

const CategoryFilter = ({
  categories,
  onChange,
  value,
}: {
  categories: readonly FinanceCategory[];
  onChange: (patch: OverviewPatch) => void;
  value: string | undefined;
}) => {
  const { t } = useTranslation("finances");
  const nameOf = useCategoryName();
  const selected = categories.find((category) => category.id === value);

  return (
    <Select
      onValueChange={(next) => {
        onChange({
          category: next === ANY ? null : next,
        });
      }}
      value={value ?? ANY}
    >
      <SelectTrigger aria-label={t("form.category")} size="chip">
        <Tag />
        {selected === undefined
          ? t("transactions.allCategories")
          : nameOf(selected)}
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}>
        <SelectItem value={ANY}>{t("transactions.anyCategory")}</SelectItem>
        {(["expense", "income"] as const).map((kind) => (
          <SelectGroup key={kind}>
            <SelectLabel>{t(`kind.${kind}`)}</SelectLabel>
            {categories.flatMap((category) =>
              category.kind === kind
                ? [
                    <SelectItem key={category.id} value={category.id}>
                      {nameOf(category)}
                    </SelectItem>,
                  ]
                : []
            )}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
};

const ClientFilter = ({
  clients,
  onChange,
  value,
}: {
  clients: readonly { id: string; name: string }[];
  onChange: (patch: OverviewPatch) => void;
  value: string | undefined;
}) => {
  const { t } = useTranslation("finances");
  const selected = clients.find((client) => client.id === value);

  return (
    <Select
      onValueChange={(next) => {
        onChange({
          client: next === ANY ? null : next,
        });
      }}
      value={value ?? ANY}
    >
      <SelectTrigger aria-label={t("form2.client")} size="chip">
        <Users />
        {selected?.name ?? t("invoices.allClients")}
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}>
        <SelectItem value={ANY}>{t("invoices.allClients")}</SelectItem>
        {clients.map((client) => (
          <SelectItem key={client.id} value={client.id}>
            {client.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

/**
 * Period, category and client for the overview's figures and charts. Nothing is filtered
 * until asked: the default is all time. One row on desktop, scrolling chips on phones.
 */
export const OverviewFilters = ({
  onChange,
  search,
  years,
}: {
  onChange: (patch: OverviewPatch) => void;
  search: OverviewSearch;
  years: readonly number[];
}) => {
  const { t } = useTranslation("finances");
  const categories = useQuery(categoriesQuery);
  const clients = useQuery(clientsQuery(Number(todayIso().slice(0, 4))));

  return (
    <div className="md:border-divider -mx-4 flex scrollbar-none items-center gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:border-b md:px-5 md:py-2">
      <PeriodFilter onChange={onChange} search={search} years={years} />
      <CategoryFilter
        categories={categories.data?.categories ?? []}
        onChange={onChange}
        value={search.category}
      />
      <ClientFilter
        clients={clients.data?.clients ?? []}
        onChange={onChange}
        value={search.client}
      />
      {hasOverviewFilters(search) && (
        <Button
          onClick={() => {
            onChange({ ...NO_PERIOD, category: null, client: null });
          }}
          size="compact"
          variant="ghost"
        >
          <X />
          {t("overview.clearFilters")}
        </Button>
      )}
    </div>
  );
};
