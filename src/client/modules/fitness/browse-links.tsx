import { Link } from "@tanstack/react-router";
import { ChevronRight, Dumbbell, Scale } from "lucide-react";
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
  to: "/fitness/trainings" | "/fitness/weight";
}) => (
  <ListRow render={<Link to={to} />}>
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
  </ListRow>
);

/** Phones only: Trainings and Weight (the sidebar links them on desktop). */
export const FitnessBrowseLinks = () => {
  const { t } = useTranslation("fitness");

  return (
    <div className="md:hidden" data-bleed="">
      <ListSection title={t("home.browse")}>
        <BrowseRow
          description={t("home.trainingsDescription")}
          icon={<Dumbbell />}
          label={t("nav.trainings")}
          to="/fitness/trainings"
        />
        <BrowseRow
          description={t("home.weightDescription")}
          icon={<Scale />}
          label={t("nav.weight")}
          to="/fitness/weight"
        />
      </ListSection>
    </div>
  );
};
