import type { ReactNode } from "react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerNested,
  DrawerTitle,
  useInsideDrawer,
} from "@/components/ui/drawer";

/**
 * Phones: a picker (calendar, searchable list) opens in its own bottom sheet,
 * nested when the field is already in one, so it fits the screen and its
 * search field can take focus (a popover over a sheet can't).
 */
export const PickerSheet = ({
  children,
  onOpenChange,
  open,
  title,
}: {
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
}) => {
  const Root = useInsideDrawer() ? DrawerNested : Drawer;

  return (
    <Root onOpenChange={onOpenChange} open={open} repositionInputs={false}>
      <DrawerContent>
        <DrawerHeader align="start">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription className="sr-only">{title}</DrawerDescription>
        </DrawerHeader>
        <div className="pb-safe-2 mx-auto w-full max-w-sm">{children}</div>
      </DrawerContent>
    </Root>
  );
};
