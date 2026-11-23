import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** "› More details": optional fields kept out of the way until asked for. */
export const FormDisclosure = ({
  children,
  label,
  onOpenChange,
  open,
}: {
  children: ReactNode;
  label: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) => (
  <>
    <Button
      aria-expanded={open}
      className="-ml-2 self-start"
      onClick={() => {
        onOpenChange(!open);
      }}
      size="xs"
      type="button"
      variant="ghost"
    >
      <ChevronRight
        aria-hidden="true"
        className={cn("transition-transform", open && "rotate-90")}
      />
      {label}
    </Button>
    {open && <div className="animate-rise mt-3">{children}</div>}
  </>
);
