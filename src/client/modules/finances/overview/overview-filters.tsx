import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Tag, Users, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { FilterBar, FilterSelect } from "@/components/app/filter-bar";
import { Button } from "@/components/ui/button";
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
      <FilterSelect
        display={periodLabel(search)}
        emptyValue={ALL}
        groups={[
          {
            options: [
              { label: t("overview.period.all"), value: ALL },
              { label: t("overview.period.last12"), value: LAST_12_MONTHS },
            ],
          },
          {
            options: options.map((year) => ({
              label:
                year === currentYear
                  ? t("overview.period.thisYear", { year })
                  : String(year),
              value: String(year),
            })),
          },
          { options: [{ label: t("overview.period.custom"), value: CUSTOM }] },
        ]}
        icon={<CalendarDays />}
        label={t("overview.period.label")}
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
      />
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
    <FilterSelect
      display={
        selected === undefined
          ? t("transactions.allCategories")
          : nameOf(selected)
      }
      emptyValue={ANY}
      groups={[
        { options: [{ label: t("transactions.anyCategory"), value: ANY }] },
        ...(["expense", "income"] as const).map((kind) => ({
          label: t(`kind.${kind}`),
          options: categories.flatMap((category) =>
            category.kind === kind
              ? [{ label: nameOf(category), value: category.id }]
              : []
          ),
        })),
      ]}
      icon={<Tag />}
      label={t("form.category")}
      onValueChange={(next) => {
        onChange({ category: next === ANY ? null : next });
      }}
      value={value ?? ANY}
    />
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
    <FilterSelect
      display={selected?.name ?? t("invoices.allClients")}
      emptyValue={ANY}
      groups={[
        { options: [{ label: t("invoices.allClients"), value: ANY }] },
        {
          options: clients.map((client) => ({
            label: client.name,
            value: client.id,
          })),
        },
      ]}
      icon={<Users />}
      label={t("form2.client")}
      onValueChange={(next) => {
        onChange({ client: next === ANY ? null : next });
      }}
      value={value ?? ANY}
    />
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
    <FilterBar sticky={false}>
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
          size="chip"
          variant="ghost"
        >
          <X />
          {t("overview.clearFilters")}
        </Button>
      )}
    </FilterBar>
  );
};
