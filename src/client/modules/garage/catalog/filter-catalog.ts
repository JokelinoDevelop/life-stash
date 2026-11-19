interface NamedItem {
  id: string;
  name: string;
  archivedAt: string | null;
}

interface NamedPackage {
  name: string;
  itemIds: string[];
}

export type CatalogView = "active" | "archived";

export interface FilteredCatalog<I, P> {
  items: I[];
  packages: P[];
}

const normalise = (text: string) => text.trim().toLocaleLowerCase();

/**
 * What the catalog page shows for a filter text and view. Packages only show in
 * the active view; one matches by its own name or any of its items' names.
 */
export const filterCatalog = <I extends NamedItem, P extends NamedPackage>({
  items,
  packages,
  query,
  view,
}: {
  items: readonly I[];
  packages: readonly P[];
  query: string;
  view: CatalogView;
}): FilteredCatalog<I, P> => {
  const needle = normalise(query);
  const matches = (name: string) => normalise(name).includes(needle);

  const inView = items.filter((item) =>
    view === "archived" ? item.archivedAt !== null : item.archivedAt === null
  );

  if (view === "archived") {
    return { items: inView.filter((item) => matches(item.name)), packages: [] };
  }

  const names = new Map(items.map((item) => [item.id, item.name]));

  return {
    items: inView.filter((item) => matches(item.name)),
    packages: packages.filter(
      (pkg) =>
        matches(pkg.name) ||
        pkg.itemIds.some((id) => matches(names.get(id) ?? ""))
    ),
  };
};
