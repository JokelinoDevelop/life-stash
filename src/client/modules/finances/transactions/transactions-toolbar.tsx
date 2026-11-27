import { CalendarDays, Search, Tag, Users } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { FilterBar, FilterSelect } from "@/components/app/filter-bar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

import type { FinanceCategory } from "../categories/categories.queries";
import { useCategoryName } from "../categories/category-label";
import { RangeChip } from "./range-chip";
import { ALL_YEARS, rangeOf } from "./transactions-search";
import type { SearchPatch, TransactionsSearch } from "./transactions-search";

const ANY = "any";
const YEARS_BACK = 5;
const SEARCH_DEBOUNCE_MS = 250;

const KindFilter = ({
  kind,
  onChange,
}: {
  kind: TransactionsSearch["kind"];
  onChange: (patch: SearchPatch) => void;
}) => {
  const { t } = useTranslation("finances");

  return (
    <ToggleGroup
      aria-label={t("kind.label")}
      className="w-full shrink-0 md:w-fit"
      onValueChange={([value]) => {
        if (value === "income" || value === "expense") {
          onChange({ kind: value });
        } else if (value === "all") {
          onChange({ kind: null });
        }
      }}
      size="segmented-block"
      spacing={0.5}
      value={[kind ?? "all"]}
      variant="segmented"
    >
      <ToggleGroupItem value="all">{t("kind.all")}</ToggleGroupItem>
      <ToggleGroupItem value="income">{t("kind.income")}</ToggleGroupItem>
      <ToggleGroupItem value="expense">{t("kind.spending")}</ToggleGroupItem>
    </ToggleGroup>
  );
};

const CategoryFilter = ({
  categories,
  onChange,
  search,
}: {
  categories: readonly FinanceCategory[];
  onChange: (patch: SearchPatch) => void;
  search: TransactionsSearch;
}) => {
  const { t } = useTranslation("finances");
  const nameOf = useCategoryName();

  const selected = categories.find(
    (category) => category.id === search.category
  );

  const kinds = (["expense", "income"] as const).filter(
    (kind) => search.kind === undefined || search.kind === kind
  );

  const byKind = new Map<string, FinanceCategory[]>();

  for (const category of categories) {
    byKind.set(category.kind, [...(byKind.get(category.kind) ?? []), category]);
  }

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
        ...kinds.map((kind) => ({
          label: t(`kind.${kind}`),
          options: (byKind.get(kind) ?? []).map((category) => ({
            label: nameOf(category),
            value: category.id,
          })),
        })),
      ]}
      icon={<Tag />}
      label={t("form.category")}
      onValueChange={(value) => {
        onChange({ category: value === ANY ? null : value });
      }}
      value={search.category ?? ANY}
    />
  );
};

const YearFilter = ({
  currentYear,
  onChange,
  year,
}: {
  currentYear: number;
  onChange: (patch: SearchPatch) => void;
  year: TransactionsSearch["year"];
}) => {
  const { t } = useTranslation("finances");
  const value = String(year ?? currentYear);

  const years = Array.from(
    { length: YEARS_BACK + 1 },
    (_, index) => currentYear - index
  );

  return (
    <FilterSelect
      display={value === ALL_YEARS ? t("transactions.allYears") : value}
      emptyValue={String(currentYear)}
      groups={[
        {
          options: years.map((option) => ({
            label: String(option),
            value: String(option),
          })),
        },
        { options: [{ label: t("transactions.allYears"), value: ALL_YEARS }] },
      ]}
      icon={<CalendarDays />}
      label={t("transactions.year")}
      onValueChange={(next) => {
        if (next === ALL_YEARS) {
          onChange({ year: ALL_YEARS });

          return;
        }

        const picked = Number(next);

        onChange({ year: picked === currentYear ? null : picked });
      }}
      value={value}
    />
  );
};

/** Search box; typing updates the URL after a short pause (replace, so Back isn't flooded). */
export const SearchBox = ({
  autoFocus = false,
  className,
  onChange,
  q,
}: {
  autoFocus?: boolean;
  className?: string;
  onChange: (patch: SearchPatch) => void;
  q: string | undefined;
}) => {
  const { t } = useTranslation("finances");
  const [text, setText] = useState(q ?? "");
  const [synced, setSynced] = useState(q);

  // Derived state: follow the URL when it changes elsewhere (e.g. "Clear filters").
  if (q !== synced) {
    setSynced(q);
    setText(q ?? "");
  }

  const commit = useEffectEvent((value: string) => {
    if (value !== (q ?? "")) {
      onChange({ q: value.trim() === "" ? null : value });
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      commit(text);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [text]);

  return (
    <InputGroup className={cn("h-9 md:h-6 md:w-52", className)}>
      <InputGroupAddon>
        <Search className="size-3.5" />
      </InputGroupAddon>
      <InputGroupInput
        aria-label={t("transactions.search")}
        autoFocus={autoFocus}
        onChange={(event) => {
          setText(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && text !== "") {
            event.stopPropagation();
            setText("");
          }
        }}
        placeholder={t("transactions.searchPlaceholder")}
        type="search"
        value={text}
      />
    </InputGroup>
  );
};

const ClientFilter = ({
  clients,
  onChange,
  value,
}: {
  clients: readonly { id: string; name: string }[];
  onChange: (patch: SearchPatch) => void;
  value: string | undefined;
}) => {
  const { t } = useTranslation("finances");
  const selected = clients.find((client) => client.id === value);

  return (
    <FilterSelect
      display={selected?.name ?? t("form2.client")}
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

/** Kind, category, client, year (or a date range) and search; one row on desktop, scrolling chips on phones. */
export const TransactionsToolbar = ({
  categories,
  clients,
  currentYear,
  onChange,
  search,
}: {
  categories: readonly FinanceCategory[];
  clients: readonly { id: string; name: string }[];
  currentYear: number;
  onChange: (patch: SearchPatch) => void;
  search: TransactionsSearch;
}) => {
  const range = rangeOf(search);

  return (
    <FilterBar
      status={<KindFilter kind={search.kind} onChange={onChange} />}
      trailing={
        <SearchBox
          className="hidden md:ml-auto md:flex"
          onChange={onChange}
          q={search.q}
        />
      }
    >
      <CategoryFilter
        categories={categories}
        onChange={onChange}
        search={search}
      />
      <ClientFilter
        clients={clients}
        onChange={onChange}
        value={search.client}
      />
      {range === null ? (
        <YearFilter
          currentYear={currentYear}
          onChange={onChange}
          year={search.year}
        />
      ) : (
        <RangeChip onChange={onChange} range={range} />
      )}
    </FilterBar>
  );
};
