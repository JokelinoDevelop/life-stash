import { createElement } from "react";

import { cn } from "@/lib/utils";

import { iconFor } from "./category-icons";

/** A category's icon in a neutral 24px tile (rows) or bare. */
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
        "bg-muted text-subtle-foreground flex size-6 shrink-0 items-center justify-center rounded-md border [&_svg]:size-3.5",
        className
      )}
    >
      {createElement(icon)}
    </span>
  );
};
