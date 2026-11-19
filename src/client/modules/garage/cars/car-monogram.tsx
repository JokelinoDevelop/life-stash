import { cn } from "@/lib/utils";

const initialsOf = (name: string): string =>
  name
    .split(/\s+/u)
    .filter((word) => word !== "")
    .slice(0, 2)
    .map((word) => word.slice(0, 1).toLocaleUpperCase())
    .join("");

const SIZES = {
  /** Sidebar: one letter in a 16px square. */
  xs: "size-4 rounded-sm text-xs leading-none",
  sm: "size-5 rounded-sm text-xs",
  md: "size-9 rounded-md text-xs",
  lg: "size-11 rounded-lg text-sm",
} as const;

/** A car's initials in a small neutral square (no photos or brand marks). */
export const CarMonogram = ({
  className,
  name,
  size = "md",
}: {
  className?: string;
  name: string;
  size?: keyof typeof SIZES;
}) => {
  const initials = initialsOf(name);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "bg-muted text-subtle-foreground flex shrink-0 items-center justify-center border font-semibold",
        SIZES[size],
        className
      )}
    >
      {size === "xs" ? initials.slice(0, 1) : initials}
    </span>
  );
};
