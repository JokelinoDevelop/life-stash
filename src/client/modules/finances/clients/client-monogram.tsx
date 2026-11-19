import { cn } from "@/lib/utils";

/** Initials of a client ("Northwind Labs" → NL) in a neutral square, like car monograms. */
export const ClientMonogram = ({
  className,
  name,
  size = "sm",
}: {
  className?: string;
  name: string;
  size?: "xs" | "sm" | "lg";
}) => {
  const letters = size === "xs" ? 1 : 2;

  const initials = name
    .split(/\s+/u)
    .filter((part) => /\p{L}/u.test(part))
    .slice(0, letters)
    .map((part) => part.charAt(0).toLocaleUpperCase())
    .join("");

  return (
    <span
      aria-hidden="true"
      className={cn(
        "bg-muted text-subtle-foreground flex shrink-0 items-center justify-center rounded-md border font-semibold",
        size === "xs" && "size-4 text-xs",
        size === "sm" && "size-6 text-xs",
        size === "lg" && "size-10 text-sm",
        className
      )}
    >
      {initials}
    </span>
  );
};
