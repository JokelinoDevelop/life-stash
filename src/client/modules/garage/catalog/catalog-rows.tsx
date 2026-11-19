import { Boxes } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ListRow, ListRowText } from "@/components/app/list-section";
import { useFormat } from "@/lib/format";

import type { CatalogItem, CatalogPackage } from "./catalog.queries";

const RowIcon = ({ children }: { children: ReactNode }) => (
  <span
    aria-hidden="true"
    className="bg-muted text-subtle-foreground flex size-8 shrink-0 items-center justify-center rounded-md border md:size-7 [&_svg]:size-4 md:[&_svg]:size-3.5"
  >
    {children}
  </span>
);

/** A whole-row button: opens the edit dialog. */
const RowButton = ({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) => (
  <ListRow
    className="w-full py-2 text-left md:py-1.5"
    render={
      <button onClick={onClick} type="button">
        {children}
      </button>
    }
  />
);

/** "4 items · Coolant, Water pump, Timing belt" */
export const PackageRow = ({
  names,
  onEdit,
  pkg,
}: {
  names: Map<string, string>;
  onEdit: () => void;
  pkg: CatalogPackage;
}) => {
  const { t } = useTranslation("garageCatalog");

  const labels = pkg.itemIds.flatMap((id) => {
    const name = names.get(id);

    return name === undefined ? [] : [name];
  });

  const count = t("packages.itemCount", { count: labels.length });
  const meta = labels.length === 0 ? count : `${count} · ${labels.join(", ")}`;

  return (
    <RowButton onClick={onEdit}>
      <RowIcon>
        <Boxes />
      </RowIcon>
      <ListRowText meta={meta} title={pkg.name} />
    </RowButton>
  );
};

/** Desktop column headings for `ItemRow`'s right-hand figures. */
export const ItemColumns = () => {
  const { t } = useTranslation("garageCatalog");

  return (
    <span className="text-muted-foreground hidden gap-3 text-xs font-normal md:flex">
      <span className="w-14 text-right">{t("items.columnDone")}</span>
      <span className="w-24 text-right">{t("items.columnLast")}</span>
    </span>
  );
};

const COLUMN =
  "text-muted-foreground hidden shrink-0 text-right text-xs tabular-nums md:block";

/**
 * Phones: "Done 6× · last 19.07.2026 · in Oil service" under the name.
 * Desktop: the packages inline, times and last date as right-aligned columns.
 */
export const ItemRow = ({
  item,
  onEdit,
  packageNames,
}: {
  item: CatalogItem;
  onEdit: () => void;
  /** Packages this item belongs to. */
  packageNames: string[];
}) => {
  const { t } = useTranslation("garageCatalog");
  const format = useFormat();
  const done = item.timesDone > 0 && item.lastDoneOn !== null;

  const usage = done
    ? `${t("items.timesDone", { count: item.timesDone })} · ${t(
        "items.lastDone",
        { date: format.date(item.lastDoneOn ?? "") }
      )}`
    : t("items.neverDone");

  const inPackages =
    packageNames.length === 0
      ? null
      : t("items.inPackages", { names: packageNames.join(", ") });

  return (
    <RowButton onClick={onEdit}>
      <ListRowText
        meta={
          <span className="tabular-nums">
            <span className="md:hidden">
              {inPackages === null ? usage : `${usage} · ${inPackages}`}
            </span>
            <span className="hidden md:inline">{inPackages}</span>
          </span>
        }
        title={item.name}
      />
      {item.archivedAt !== null && (
        <span className="text-muted-foreground shrink-0 text-xs">
          {t("items.archived")}
        </span>
      )}
      <span className={`${COLUMN} w-14`}>
        {done ? `${item.timesDone}×` : "—"}
      </span>
      <span className={`${COLUMN} w-24`}>
        {done ? format.date(item.lastDoneOn ?? "") : "—"}
      </span>
    </RowButton>
  );
};
