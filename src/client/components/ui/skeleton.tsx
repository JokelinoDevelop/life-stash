import { cn } from "@/lib/utils";

function Skeleton({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  /** `circle`: a round placeholder for status rings and avatars. */
  variant?: "default" | "circle";
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-accent animate-pulse rounded-md",
        variant === "circle" && "rounded-full",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
