import type { ComponentProps, ReactElement, ReactNode } from "react";

import { useIsDesktop } from "@/components/app/responsive-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { PickerSheet } from "./picker-sheet";

/**
 * A searchable picker (a `Command` list): a popover under its trigger on
 * desktop, its own bottom sheet on phones. `renderTrigger` draws the button,
 * content included, from the props it is given (spread them on the button).
 */
export const ResponsivePicker = ({
  children,
  onOpenChange,
  open,
  title,
  renderTrigger,
}: {
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  /** The sheet's heading on phones. */
  title: string;
  renderTrigger: (props: ComponentProps<"button">) => ReactElement;
}) => {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <Popover onOpenChange={onOpenChange} open={open}>
        <PopoverTrigger render={(props) => renderTrigger(props)} />
        <PopoverContent align="start" variant="bare">
          <div className="w-60">{children}</div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <>
      {renderTrigger({
        onClick: () => {
          onOpenChange(true);
        },
      })}
      <PickerSheet onOpenChange={onOpenChange} open={open} title={title}>
        {/* A fixed height, so the sheet doesn't shrink as the list filters. */}
        <div className="h-100 px-2">{children}</div>
      </PickerSheet>
    </>
  );
};
