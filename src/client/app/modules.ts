import { CarFront } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AppModule {
  id: string;
  /** Key in the `common` namespace under `nav`. */
  labelKey: "nav.garage";
  icon: LucideIcon;
  to: "/garage";
}

/** Modules shown in navigation. New modules (e.g. Home, Health) register here. */
export const APP_MODULES: readonly AppModule[] = [
  { icon: CarFront, id: "garage", labelKey: "nav.garage", to: "/garage" },
];
