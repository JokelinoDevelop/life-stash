import { CalendarDays, Search, Tag, Users } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

import type { FinanceCategory } from "../categories/categories.queries";
import { useCategoryName } from "../categories/category-label";
import { ALL_YEARS } from "./transactions-search";
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
      className="shrink-0"
      onValueChange={([value]) => {
        if (value === "income" || value === "expense") {
          onChange({ kind: value });
        } else if (value === "all") {
          onChange({ kind: null });
        }
      }}
      size="segmented"
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
    <Select
      onValueChange={(value) => {
        onChange({ category: value === ANY ? null : value });
      }}
      value={search.category ?? ANY}
    >
      <SelectTrigger aria-label={t("form.category")} size="chip">
        <Tag />
        {selected === undefined
          ? t("transactions.allCategories")
          : nameOf(selected)}
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}>
        <SelectItem value={ANY}>{t("transactions.anyCategory")}</SelectItem>
        {kinds.map((kind) => (
          <SelectGroup key={kind}>
            <SelectLabel>{t(`kind.${kind}`)}</SelectLabel>
            {(byKind.get(kind) ?? []).map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {nameOf(category)}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
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
    <Select
      onValueChange={(next) => {
        if (next === ALL_YEARS) {
          onChange({ year: ALL_YEARS });

          return;
        }

        const picked = Number(next);

        onChange({ year: picked === currentYear ? null : picked });
      }}
      value={value}
    >
      <SelectTrigger aria-label={t("transactions.year")} size="chip">
        <CalendarDays />
        {value === ALL_YEARS ? t("transactions.allYears") : value}
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}>
        {years.map((option) => (
          <SelectItem key={option} value={String(option)}>
            {option}
          </SelectItem>
        ))}
        <SelectItem value={ALL_YEARS}>{t("transactions.allYears")}</SelectItem>
      </SelectContent>
    </Select>
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
    <Select
      onValueChange={(next) => {
        onChange({ client: next === ANY ? null : next });
      }}
      value={value ?? ANY}
    >
      <SelectTrigger aria-label={t("form2.client")} size="chip">
        <Users />
        {selected?.name ?? t("form2.client")}
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

/** Kind, category, client, year and search; one row on desktop, scrolling chips on phones. */
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
}) => (
  <div className="md:border-divider -mx-4 flex scrollbar-none items-center gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:border-b md:px-5 md:py-2">
    <KindFilter kind={search.kind} onChange={onChange} />
    <CategoryFilter
      categories={categories}
      onChange={onChange}
      search={search}
    />
    <ClientFilter clients={clients} onChange={onChange} value={search.client} />
    <YearFilter
      currentYear={currentYear}
      onChange={onChange}
      year={search.year}
    />
    <span className="hidden flex-1 md:block" />
    <SearchBox className="hidden md:flex" onChange={onChange} q={search.q} />
  </div>
);
