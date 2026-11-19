import { cn } from "@/lib/utils";

const initialsOf = (name: string): string =>
  name
    .split(/\s+/u)
    .filter((word) => word !== "")
    .slice(0, 2)
    .map((word) => word.slice(0, 1).toLocaleUpperCase())
    .join("");

/** A car's initials in a small neutral square (no photos or brand marks). */
export const CarMonogram = ({
  className,
  name,
}: {
  className?: string;
  name: string;
}) => (
  <span
    aria-hidden="true"
    className={cn(
      "bg-muted text-subtle-foreground flex size-9 shrink-0 items-center justify-center rounded-md border text-xs font-semibold",
      className
    )}
  >
    {initialsOf(name)}
  </span>
);
