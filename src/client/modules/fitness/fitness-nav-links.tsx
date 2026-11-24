import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

/** The Fitness pages under the module in the sidebar (the module name opens the calendar). */
export const FitnessNavLinks = ({
  activeClassName,
  className,
}: {
  activeClassName: string;
  className: string;
}) => {
  const { t } = useTranslation("fitness");

  return (
    <>
      <Link
        activeProps={{ className: activeClassName }}
        className={className}
        to="/fitness/trainings"
      >
        {t("nav.trainings")}
      </Link>
      <Link
        activeProps={{ className: activeClassName }}
        className={className}
        to="/fitness/weight"
      >
        {t("nav.weight")}
      </Link>
    </>
  );
};
