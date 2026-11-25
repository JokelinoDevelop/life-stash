import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

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
 * Phones: the calendar opens in its own bottom sheet (nested when the field is
 * already in one), so it always fits the screen.
 */
export const DatePickerSheet = ({
  children,
  onOpenChange,
  open,
}: {
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) => {
  const { t } = useTranslation();
  const Root = useInsideDrawer() ? DrawerNested : Drawer;

  return (
    <Root onOpenChange={onOpenChange} open={open} repositionInputs={false}>
      <DrawerContent>
        <DrawerHeader align="start">
          <DrawerTitle>{t("date.pick")}</DrawerTitle>
          <DrawerDescription className="sr-only">
            {t("date.pick")}
          </DrawerDescription>
        </DrawerHeader>
        <div className="pb-safe-2 mx-auto w-full max-w-sm">{children}</div>
      </DrawerContent>
    </Root>
  );
};
