import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowLeftRight,
  ChevronRight,
  Dumbbell,
  FileText,
  Plus,
  Receipt,
  Scale,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { useFinanceDialog } from "@/modules/finances/dialogs/use-finance-dialog";
import { useFitnessDialog } from "@/modules/fitness/dialogs/use-fitness-dialog";
import { carsQuery } from "@/modules/garage/cars/cars.queries";
import { useEntryDialog } from "@/modules/garage/entry-dialogs/use-entry-dialog";

type CarEntry = "service" | "expense";

interface CarOption {
  id: string;
  name: string;
}

const Option = ({
  icon,
  label,
  onSelect,
  trailing,
}: {
  icon?: ReactNode;
  label: string;
  onSelect: () => void;
  trailing?: ReactNode;
}) => (
  <li>
    <button
      className="active:bg-accent flex min-h-13 w-full items-center gap-3 px-4 text-left font-medium transition-colors [&_svg]:size-5"
      onClick={onSelect}
      type="button"
    >
      {icon !== undefined && (
        <span className="text-muted-foreground flex shrink-0">{icon}</span>
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {trailing}
    </button>
  </li>
);

/** The first step: what to add. Car entries only when there is a car. */
const WhatToAdd = ({
  hasCars,
  onCarEntry,
  onClose,
}: {
  hasCars: boolean;
  onCarEntry: (dialog: CarEntry) => void;
  onClose: () => void;
}) => {
  const { t: tFinances } = useTranslation("finances");
  const { t: tVisits } = useTranslation("garageVisits");
  const { t: tExpenses } = useTranslation("garageExpenses");
  const { t: tFitness } = useTranslation("fitness");
  const financeDialog = useFinanceDialog();
  const fitnessDialog = useFitnessDialog();

  return (
    <ul className="divide-divider divide-y">
      <Option
        icon={<ArrowLeftRight />}
        label={tFinances("transactions.log")}
        onSelect={() => {
          onClose();
          void financeDialog.open({ dialog: "transaction" });
        }}
      />
      <Option
        icon={<FileText />}
        label={tFinances("invoices.new")}
        onSelect={() => {
          onClose();
          void financeDialog.open({ dialog: "invoice" });
        }}
      />
      <Option
        icon={<Dumbbell />}
        label={tFitness("sessions.add")}
        onSelect={() => {
          onClose();
          void fitnessDialog.open({ dialog: "session" });
        }}
      />
      <Option
        icon={<Scale />}
        label={tFitness("weight.add")}
        onSelect={() => {
          onClose();
          void fitnessDialog.open({ dialog: "weight" });
        }}
      />
      {hasCars && (
        <>
          <Option
            icon={<Wrench />}
            label={tVisits("history.add")}
            onSelect={() => {
              onCarEntry("service");
            }}
          />
          <Option
            icon={<Receipt />}
            label={tExpenses("add")}
            onSelect={() => {
              onCarEntry("expense");
            }}
          />
        </>
      )}
    </ul>
  );
};

const CarPicker = ({
  cars,
  onPick,
}: {
  cars: CarOption[];
  onPick: (car: string) => void;
}) => (
  <ul className="divide-divider divide-y">
    {cars.map((car) => (
      <Option
        key={car.id}
        label={car.name}
        onSelect={() => {
          onPick(car.id);
        }}
        trailing={<ChevronRight className="text-muted-foreground size-4" />}
      />
    ))}
  </ul>
);

/**
 * The tab bar's middle button: a bottom sheet to log the common things from
 * any screen. Car entries ask which car first when there is more than one.
 */
export const QuickAdd = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pickingFor, setPickingFor] = useState<CarEntry | null>(null);
  const cars = useQuery(carsQuery(false));
  const entryDialog = useEntryDialog();

  const active = (cars.data?.cars ?? []).filter(
    (car) => car.archivedAt === null
  );

  const close = () => {
    setOpen(false);
  };

  const openCarEntry = (dialog: CarEntry, car: string) => {
    close();
    void entryDialog.open({ car, dialog });
  };

  const startCarEntry = (dialog: CarEntry) => {
    const [only] = active;

    if (active.length === 1 && only !== undefined) {
      openCarEntry(dialog, only.id);
    } else {
      setPickingFor(dialog);
    }
  };

  return (
    <Drawer
      onOpenChange={(next) => {
        setOpen(next);

        if (!next) {
          setPickingFor(null);
        }
      }}
      open={open}
    >
      <button
        aria-label={t("nav.quickAdd")}
        className="bg-primary text-primary-foreground shadow-primary/30 flex size-12 shrink-0 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95"
        onClick={() => {
          setOpen(true);
        }}
        type="button"
      >
        <Plus className="size-6" strokeWidth={2} />
      </button>
      <DrawerContent>
        <div className="pb-safe-4 flex flex-col">
          <div className="flex min-h-12 items-center gap-1 px-2 pt-2">
            {pickingFor !== null && (
              <button
                aria-label={t("actions.back")}
                className="text-muted-foreground flex size-9 items-center justify-center rounded-md"
                onClick={() => {
                  setPickingFor(null);
                }}
                type="button"
              >
                <ArrowLeft className="size-5" />
              </button>
            )}
            <div className="px-2">
              <DrawerTitle>
                {pickingFor === null ? t("nav.quickAdd") : t("nav.pickCar")}
              </DrawerTitle>
            </div>
          </div>
          {pickingFor === null ? (
            <WhatToAdd
              hasCars={active.length > 0}
              onCarEntry={startCarEntry}
              onClose={close}
            />
          ) : (
            <CarPicker
              cars={active}
              onPick={(car) => {
                openCarEntry(pickingFor, car);
              }}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
