import { Link } from "@tanstack/react-router";
import type { LinkProps } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

/** Back to a typed route: an arrow on phones, a labelled crumb in the desktop bar. */
export const BackLink = (
  props: Pick<LinkProps, "to" | "params" | "search"> & { label?: string }
) => {
  const { t } = useTranslation();
  const { label, ...link } = props;
  const text = label ?? t("actions.back");

  return (
    <Button
      className="-ml-2"
      size="compact"
      variant="ghost"
      render={<Link aria-label={text} {...link} />}
      nativeButton={false}
    >
      <ArrowLeft className="size-5 md:hidden" />
      <span className="hidden md:inline">{text}</span>
    </Button>
  );
};
