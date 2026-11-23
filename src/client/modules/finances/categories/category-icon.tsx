import { createElement } from "react";

import { TINT_TILE } from "@/components/app/tint";
import { cn } from "@/lib/utils";

import { iconFor } from "./category-icons";
import { categoryTint } from "./category-tint";

/** A category's icon in a 24px tile (rows; tinted on phones, neutral on desktop) or bare. */
export const CategoryIcon = ({
  bare = false,
  className,
  name,
}: {
  name: string | null;
  bare?: boolean;
  className?: string;
}) => {
  const icon = iconFor(name);

  if (bare) {
    return createElement(icon, {
      "aria-hidden": true,
      className: cn("size-3.5", className),
    });
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "bg-muted text-subtle-foreground flex size-6 shrink-0 items-center justify-center rounded-md border max-md:size-8 max-md:rounded-lg [&_svg]:size-3.5 max-md:[&_svg]:size-4",
        TINT_TILE[categoryTint(name)],
        className
      )}
    >
      {createElement(icon)}
    </span>
  );
};
