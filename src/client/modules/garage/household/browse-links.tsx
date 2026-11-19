import { Link } from "@tanstack/react-router";
import { BookOpen, ChevronRight, History } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  ListRow,
  ListRowText,
  ListSection,
} from "@/components/app/list-section";

const BrowseRow = ({
  description,
  icon,
  label,
  to,
}: {
  description: string;
  icon: ReactNode;
  label: string;
  to: "/garage/catalog" | "/garage/history";
}) => (
  <ListRow asChild>
    <Link to={to}>
      <span
        aria-hidden="true"
        className="bg-muted text-subtle-foreground flex size-8 shrink-0 items-center justify-center rounded-md border [&_svg]:size-4"
      >
        {icon}
      </span>
      <ListRowText meta={description} title={label} />
      <ChevronRight
        aria-hidden="true"
        className="text-muted-foreground/60 size-4 shrink-0"
      />
    </Link>
  </ListRow>
);

/**
 * Phones only: the pages the desktop sidebar links to that the bottom bar
 * has no room for.
 */
export const BrowseLinks = () => {
  const { t } = useTranslation();
  const { t: tg } = useTranslation("garage");

  return (
    <div className="md:hidden" data-bleed="">
      <ListSection title={tg("home.browse")}>
        <BrowseRow
          description={tg("home.historyDescription")}
          icon={<History />}
          label={t("nav.history")}
          to="/garage/history"
        />
        <BrowseRow
          description={tg("home.catalogDescription")}
          icon={<BookOpen />}
          label={t("nav.catalog")}
          to="/garage/catalog"
        />
      </ListSection>
    </div>
  );
};
