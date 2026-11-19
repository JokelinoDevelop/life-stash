import { ChevronDown, Users } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { ClientMonogram } from "../../../clients/client-monogram";

export interface ClientOption {
  id: string;
  name: string;
}

/** Income: who paid. A chip that opens a searchable client list (with "No client"). */
export const ClientPicker = ({
  clients,
  onChange,
  value,
}: {
  clients: readonly ClientOption[];
  onChange: (clientId: string) => void;
  value: string;
}) => {
  const { t } = useTranslation("finances");
  const [open, setOpen] = useState(false);
  const selected = clients.find((client) => client.id === value);
  const clientLabel = t("form2.client");

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={
          <Button
            aria-label={clientLabel}
            data-empty={selected === undefined}
            size="xs"
            type="button"
            variant="field"
          />
        }
      >
        {selected === undefined ? (
          <Users />
        ) : (
          <ClientMonogram name={selected.name} size="xs" />
        )}
        <span>{selected?.name ?? clientLabel}</span>
        <ChevronDown className="opacity-60" />
      </PopoverTrigger>
      <PopoverContent align="start" variant="bare">
        <Command className="w-60">
          <CommandInput placeholder={clientLabel} />
          <CommandList>
            <CommandEmpty>—</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  onChange("");
                  setOpen(false);
                }}
                value="—"
              >
                {t("form2.noClient")}
              </CommandItem>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  onSelect={() => {
                    onChange(client.id);
                    setOpen(false);
                  }}
                  value={`${client.name} ${client.id}`}
                >
                  <ClientMonogram name={client.name} size="xs" />
                  {client.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
