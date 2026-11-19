import * as React from "react";

import { cn } from "@/lib/utils";

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "bg-muted text-muted-foreground pointer-events-none inline-flex h-[18px] w-fit min-w-[18px] items-center justify-center gap-1 rounded-sm border px-1 font-sans text-[11px] font-medium select-none [&_svg:not([class*='size-'])]:size-3",
        // Inside a primary button or a tooltip the key sits on a filled surface.
        "[[data-slot=button][data-variant=default]_&]:bg-primary-foreground/15 [[data-slot=button][data-variant=default]_&]:text-primary-foreground [[data-slot=button][data-variant=default]_&]:border-transparent",
        "[[data-slot=tooltip-content]_&]:bg-background/20 [[data-slot=tooltip-content]_&]:text-background [[data-slot=tooltip-content]_&]:border-transparent",
        className
      )}
      {...props}
    />
  );
}

function KbdGroup({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  );
}

export { Kbd, KbdGroup };
