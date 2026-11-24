import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { householdOverviewQuery } from "@/modules/garage/household/household.queries";

const Initial = ({ name }: { name: string }) => (
  <span className="bg-foreground text-background flex size-5 shrink-0 items-center justify-center rounded-sm text-xs font-bold">
    {name.slice(0, 1).toLocaleUpperCase()}
  </span>
);

/** The household's mark and name (a label, not a menu). */
export const HouseholdName = ({ className }: { className?: string }) => {
  const { t } = useTranslation();
  const household = useQuery(householdOverviewQuery);
  const name = household.data?.householdName ?? t("appName");

  return (
    <div
      className={cn(
        "flex h-8 min-w-0 items-center gap-2 px-2 text-sm font-semibold",
        className
      )}
    >
      <Initial name={name} />
      <span className="min-w-0 flex-1 truncate">{name}</span>
    </div>
  );
};
