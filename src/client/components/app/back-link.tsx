import { Link } from "@tanstack/react-router";
import type { LinkProps } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

/** "Back" link to a typed route. */
export const BackLink = (
  props: Pick<LinkProps, "to" | "params" | "search"> & { label?: string }
) => {
  const { t } = useTranslation();
  const { label, ...link } = props;

  return (
    <Button asChild className="-ml-3 self-start" size="sm" variant="ghost">
      <Link {...link}>
        <ArrowLeft />
        {label ?? t("actions.back")}
      </Link>
    </Button>
  );
};
