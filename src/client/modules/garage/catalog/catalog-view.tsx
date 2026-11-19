import { useQuery } from "@tanstack/react-query";
import { Boxes, Plus, Search, Wrench } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ListRow, ListSection } from "@/components/app/list-section";
import { PageStack } from "@/components/app/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CATALOG_SHORTCUTS } from "@/lib/shortcuts";

import { ItemColumns, ItemRow, PackageRow } from "./catalog-rows";
import { catalogItemsQuery, catalogPackagesQuery } from "./catalog.queries";
import type { CatalogItem, CatalogPackage } from "./catalog.queries";
import { filterCatalog } from "./filter-catalog";
import type { CatalogView as View } from "./filter-catalog";

export type CatalogTarget =
  | { kind: "item"; item: CatalogItem | null }
  | { kind: "package"; pkg: CatalogPackage | null };

const isView = (value: string): value is View =>
  value === "active" || value === "archived";

const Toolbar = ({
  archivedCount,
  onQueryChange,
  onViewChange,
  query,
  view,
}: {
  archivedCount: number;
  onQueryChange: (query: string) => void;
  onViewChange: (view: View) => void;
  query: string;
  view: View;
}) => {
  const { t } = useTranslation("garageCatalog");

  return (
    <div className="flex items-center gap-2">
      <InputGroup className="flex-1 md:max-w-xs">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          aria-label={t("search")}
          onChange={(event) => {
            onQueryChange(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && query !== "") {
              event.stopPropagation();
              onQueryChange("");
            }
          }}
          placeholder={t("searchPlaceholder")}
          type="search"
          value={query}
        />
      </InputGroup>
      <ToggleGroup
        aria-label={t("filterLabel")}
        className="shrink-0"
        onValueChange={([next = ""]) => {
          if (isView(next)) {
            onViewChange(next);
          }
        }}
        size="segmented"
        spacing={0.5}
        value={[view]}
        variant="segmented"
      >
        <ToggleGroupItem value="active">{t("filter.active")}</ToggleGroupItem>
        <ToggleGroupItem value="archived">
          {t("filter.archived")}
          {archivedCount > 0 && (
            <span className="text-muted-foreground tabular-nums">
              {archivedCount}
            </span>
          )}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

const PackagesList = ({
  names,
  onOpen,
  packages,
}: {
  names: Map<string, string>;
  onOpen: (target: CatalogTarget) => void;
  packages: CatalogPackage[];
}) => {
  const { t } = useTranslation("garageCatalog");

  return (
    <ListSection count={packages.length} title={t("packages.title")}>
      {packages.length === 0 ? (
        <ListRow className="text-muted-foreground gap-3 text-sm">
          <Boxes aria-hidden="true" className="size-4 shrink-0" />
          {t("packages.empty")}
        </ListRow>
      ) : (
        packages.map((pkg) => (
          <PackageRow
            key={pkg.id}
            names={names}
            onEdit={() => {
              onOpen({ kind: "package", pkg });
            }}
            pkg={pkg}
          />
        ))
      )}
    </ListSection>
  );
};

const ItemsList = ({
  items,
  onOpen,
  packages,
  view,
}: {
  items: CatalogItem[];
  onOpen: (target: CatalogTarget) => void;
  packages: CatalogPackage[];
  view: View;
}) => {
  const { t } = useTranslation("garageCatalog");

  const packagesOf = (itemId: string) =>
    packages.flatMap((pkg) => (pkg.itemIds.includes(itemId) ? [pkg.name] : []));

  return (
    <ListSection
      action={<ItemColumns />}
      count={items.length}
      title={view === "active" ? t("items.title") : t("filter.archived")}
    >
      {items.map((item) => (
        <ItemRow
          item={item}
          key={item.id}
          onEdit={() => {
            onOpen({ item, kind: "item" });
          }}
          packageNames={packagesOf(item.id)}
        />
      ))}
    </ListSection>
  );
};

/** "No matches" or "no archived items", when the toolbar leaves nothing. */
const NothingShown = ({ query }: { query: string }): ReactNode => {
  const { t } = useTranslation("garageCatalog");

  return query === "" ? (
    <EmptyState icon={<Wrench />} message={t("items.emptyArchived")} />
  ) : (
    <EmptyState icon={<Search />} message={t("noMatches", { query })} />
  );
};

/** Toolbar, then packages and items; every row opens its edit dialog. */
const CatalogLists = ({
  items,
  onOpen,
  packages,
}: {
  items: CatalogItem[];
  onOpen: (target: CatalogTarget) => void;
  packages: CatalogPackage[];
}) => {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("active");
  const names = new Map(items.map((item) => [item.id, item.name]));
  const trimmed = query.trim();
  const shown = filterCatalog({ items, packages, query, view });
  const nothing = shown.items.length === 0 && shown.packages.length === 0;
  const packagesVisible = trimmed === "" || shown.packages.length > 0;

  return (
    <PageStack>
      <Toolbar
        archivedCount={items.filter((item) => item.archivedAt !== null).length}
        onQueryChange={setQuery}
        onViewChange={setView}
        query={query}
        view={view}
      />
      {nothing && (trimmed !== "" || view === "archived") && (
        <NothingShown query={trimmed} />
      )}
      {view === "active" && packagesVisible && (
        <PackagesList names={names} onOpen={onOpen} packages={shown.packages} />
      )}
      {shown.items.length > 0 && (
        <ItemsList
          items={shown.items}
          onOpen={onOpen}
          packages={packages}
          view={view}
        />
      )}
    </PageStack>
  );
};

/** The catalog page body: loading, error, first-run empty state or the lists. */
export const CatalogView = ({
  onOpen,
}: {
  onOpen: (target: CatalogTarget) => void;
}) => {
  const { t } = useTranslation("garageCatalog");
  const items = useQuery(catalogItemsQuery(true));
  const packages = useQuery(catalogPackagesQuery);

  if (items.isPending || packages.isPending) {
    return <LoadingState sections={2} />;
  }

  if (items.isError || packages.isError) {
    return (
      <ErrorState
        error={items.error ?? packages.error}
        onRetry={() => {
          void items.refetch();
          void packages.refetch();
        }}
      />
    );
  }

  if (items.data.items.length === 0 && packages.data.packages.length === 0) {
    return (
      <PageStack>
        <EmptyState
          action={
            <Button
              onClick={() => {
                onOpen({ item: null, kind: "item" });
              }}
              size="compact"
            >
              <Plus />
              {t("items.add")}
              <Kbd className="hidden md:inline-flex">
                {CATALOG_SHORTCUTS.newItem.toUpperCase()}
              </Kbd>
            </Button>
          }
          icon={<Wrench />}
          message={t("items.empty")}
        />
      </PageStack>
    );
  }

  return (
    <CatalogLists
      items={items.data.items}
      onOpen={onOpen}
      packages={packages.data.packages}
    />
  );
};
