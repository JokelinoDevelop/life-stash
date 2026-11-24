import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import {
  BellPlus,
  CarFront,
  Fuel,
  Gauge,
  History,
  ListChecks,
  Plus,
  ALargeSmall,
  Settings,
  Sun,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { readDensity, toggleDensity } from "@/app/density";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { useHotkey } from "@/hooks/use-hotkey";
import { ADD_CAR_SHORTCUT, CAR_SHORTCUTS } from "@/lib/shortcuts";
import type { CarShortcutAction } from "@/lib/shortcuts";
import {
  FinanceActionsGroup,
  FinanceInvoicesGroup,
  FinancePagesGroup,
} from "@/modules/finances/finance-commands";
import {
  FitnessActionsGroup,
  FitnessPagesGroup,
} from "@/modules/fitness/fitness-commands";
import type { CarListItem } from "@/modules/garage/cars/car-row";
import { carsQuery } from "@/modules/garage/cars/cars.queries";
import { useCarJump } from "@/modules/garage/cars/use-car-jump";
import { DIALOG_FOR_CAR_ACTION } from "@/modules/garage/entry-dialogs/entry-dialog-search";
import { useEntryDialog } from "@/modules/garage/entry-dialogs/use-entry-dialog";

import { CommandMenuContext } from "./command-menu-context";
import type { CommandMenuControls } from "./command-menu-context";
import { Hints, Item } from "./command-menu-parts";

/** Closes the menu, then starts the given navigation. */
type Run = (start: () => Promise<void>) => void;

const CAR_ACTION_ICONS: Record<CarShortcutAction, LucideIcon> = {
  addExpense: Fuel,
  addReminder: BellPlus,
  addService: Wrench,
  logOdometer: Gauge,
};

const CAR_ACTIONS: CarShortcutAction[] = [
  "logOdometer",
  "addService",
  "addExpense",
  "addReminder",
];

const ActionsGroup = ({
  current,
  run,
}: {
  current: CarListItem | undefined;
  run: Run;
}) => {
  const { t } = useTranslation("command");
  const navigate = useNavigate();
  const entryDialog = useEntryDialog();
  const car = current?.archivedAt === null ? current : undefined;

  const go = async (action: CarShortcutAction, carId: string) => {
    await (action === "logOdometer"
      ? navigate({
          params: { carId },
          search: { log: true, tab: "timeline" },
          to: "/garage/cars/$carId",
        })
      : entryDialog.open({
          car: carId,
          dialog: DIALOG_FOR_CAR_ACTION[action],
        }));
  };

  return (
    <CommandGroup heading={t("groups.actions")}>
      {car !== undefined &&
        CAR_ACTIONS.map((action) => (
          <Item
            icon={CAR_ACTION_ICONS[action]}
            key={action}
            label={t(`actions.${action}`)}
            meta={t("inCar", { car: car.name })}
            onSelect={() => {
              run(async () => {
                await go(action, car.id);
              });
            }}
            shortcut={CAR_SHORTCUTS[action]}
          />
        ))}
      <Item
        icon={Plus}
        label={t("actions.addCar")}
        onSelect={() => {
          run(async () => {
            await entryDialog.open({ dialog: "car" });
          });
        }}
        shortcut={ADD_CAR_SHORTCUT}
      />
    </CommandGroup>
  );
};

/** Cars reachable with G then 1–9, in list order. */
const MAX_JUMP = 9;

const CarsGroup = ({ cars, run }: { cars: CarListItem[]; run: Run }) => {
  const { t } = useTranslation("command");
  const navigate = useNavigate();

  if (cars.length === 0) {
    return null;
  }

  return (
    <CommandGroup heading={t("groups.cars")}>
      {cars.map((car, index) => (
        <Item
          icon={CarFront}
          jump={index < MAX_JUMP ? String(index + 1) : undefined}
          key={car.id}
          keywords={[car.plate, car.make, car.model].filter(
            (part): part is string => part !== null
          )}
          label={car.name}
          meta={car.plate ?? undefined}
          onSelect={() => {
            run(async () => {
              await navigate({
                params: { carId: car.id },
                to: "/garage/cars/$carId",
              });
            });
          }}
        />
      ))}
    </CommandGroup>
  );
};

type PagePath =
  | "/"
  | "/garage"
  | "/garage/history"
  | "/garage/catalog"
  | "/settings";

const PAGES: readonly {
  icon: LucideIcon;
  label: PageLabel;
  to: PagePath;
}[] = [
  { icon: Sun, label: "today", to: "/" },
  { icon: CarFront, label: "garage", to: "/garage" },
  { icon: History, label: "history", to: "/garage/history" },
  { icon: ListChecks, label: "catalog", to: "/garage/catalog" },
  { icon: Settings, label: "settings", to: "/settings" },
];

type PageLabel = "today" | "garage" | "history" | "catalog" | "settings";

const PagesGroup = ({ run }: { run: Run }) => {
  const { t } = useTranslation("command");
  const navigate = useNavigate();

  return (
    <CommandGroup heading={t("groups.goTo")}>
      {PAGES.map((page) => (
        <Item
          icon={page.icon}
          key={page.to}
          label={t(`pages.${page.label}`)}
          onSelect={() => {
            run(async () => {
              await navigate({ to: page.to });
            });
          }}
        />
      ))}
    </CommandGroup>
  );
};

const CommandMenuDialog = ({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) => {
  const { t } = useTranslation("command");
  const { carId } = useParams({ strict: false });
  // Loaded with the app shell so the list is ready before the menu opens;
  // otherwise the first highlighted row jumps when it arrives.
  const cars = useQuery(carsQuery(false));
  const list = cars.data?.cars ?? [];
  const current = list.find((car) => car.id === carId);

  const onFinances = useRouterState({
    select: (state) => state.location.pathname.startsWith("/finances"),
  });

  const onFitness = useRouterState({
    select: (state) => state.location.pathname.startsWith("/fitness"),
  });

  const run: Run = (start) => {
    onOpenChange(false);
    void start();
  };

  return (
    <CommandDialog
      className="top-[12%] translate-y-0 sm:max-w-xl"
      description={t("description")}
      onOpenChange={onOpenChange}
      open={open}
      title={t("title")}
    >
      <CommandInput
        placeholder={t("placeholder")}
        trailing={
          current === undefined ? undefined : (
            <span className="text-muted-foreground hidden shrink-0 items-center gap-1.5 text-xs sm:flex">
              {t("in")}
              <span className="bg-muted text-subtle-foreground rounded-sm border px-1.5 py-0.5 font-medium">
                {current.name}
              </span>
            </span>
          )
        }
      />
      <CommandList>
        <CommandEmpty>{t("empty")}</CommandEmpty>
        {onFinances && <FinanceActionsGroup run={run} />}
        {onFinances && <FinanceInvoicesGroup run={run} />}
        {onFinances && <FinancePagesGroup run={run} />}
        {onFitness && <FitnessActionsGroup run={run} />}
        {onFitness && <FitnessPagesGroup run={run} />}
        <ActionsGroup current={current} run={run} />
        <CarsGroup cars={list} run={run} />
        <PagesGroup run={run} />
        <CommandGroup heading={t("groups.view")}>
          <Item
            icon={ALargeSmall}
            label={t(
              readDensity() === "comfortable"
                ? "view.compact"
                : "view.comfortable"
            )}
            onSelect={() => {
              onOpenChange(false);
              toggleDensity();
            }}
          />
        </CommandGroup>
        {!onFinances && <FinanceActionsGroup run={run} />}
        {!onFinances && <FinancePagesGroup run={run} />}
        {!onFitness && <FitnessActionsGroup run={run} />}
        {!onFitness && <FitnessPagesGroup run={run} />}
      </CommandList>
      <Hints />
    </CommandDialog>
  );
};

/** Provides the ⌘K menu to the whole app and binds ⌘K / Ctrl+K and "/". */
export const CommandMenuProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  useCarJump();

  useHotkey(
    "k",
    () => {
      setOpen((value) => !value);
    },
    { mod: true }
  );
  useHotkey("/", () => {
    setOpen(true);
  });

  const controls = useMemo<CommandMenuControls>(
    () => ({
      open: () => {
        setOpen(true);
      },
    }),
    []
  );

  return (
    <CommandMenuContext.Provider value={controls}>
      {children}
      <CommandMenuDialog onOpenChange={setOpen} open={open} />
    </CommandMenuContext.Provider>
  );
};
