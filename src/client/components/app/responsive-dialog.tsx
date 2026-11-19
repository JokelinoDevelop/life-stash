import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

const DESKTOP_QUERY = "(min-width: 768px)";

const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", onChange);

  return () => {
    media.removeEventListener("change", onChange);
  };
};

export const useIsDesktop = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches
  );

/** A dialog on desktop and a bottom sheet on phones — ideal for quick logging. */
export const ResponsiveDialog = ({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) => {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description !== undefined && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer onOpenChange={onOpenChange} open={open}>
      <DrawerContent>
        <DrawerHeader align="start">
          <DrawerTitle>{title}</DrawerTitle>
          {description !== undefined && (
            <DrawerDescription>{description}</DrawerDescription>
          )}
        </DrawerHeader>
        <div className="max-h-[75dvh] overflow-y-auto px-4 pb-6">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
