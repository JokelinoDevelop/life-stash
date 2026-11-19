import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CommandItem, CommandShortcut } from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";

/** One command row: icon, label, muted context and its key hint. */
export const Item = ({
  icon: Icon,
  jump,
  keywords,
  label,
  meta,
  onSelect,
  shortcut,
}: {
  icon: LucideIcon;
  /** "G then N" jump key. */
  jump?: string;
  keywords?: string[];
  label: string;
  meta?: string;
  onSelect: () => void;
  shortcut?: string;
}) => (
  <CommandItem keywords={keywords} onSelect={onSelect} value={label}>
    <Icon />
    <span className="truncate">{label}</span>
    {meta !== undefined && (
      <span className="text-muted-foreground truncate">{meta}</span>
    )}
    {shortcut !== undefined && (
      <CommandShortcut>
        <Kbd>{shortcut.toUpperCase()}</Kbd>
      </CommandShortcut>
    )}
    {jump !== undefined && (
      <CommandShortcut>
        <Kbd>G</Kbd>
        <Kbd>{jump}</Kbd>
      </CommandShortcut>
    )}
  </CommandItem>
);

/** Footer with the keys that move, open and close. */
export const Hints = () => {
  const { t } = useTranslation("command");

  return (
    <div className="text-muted-foreground bg-background hidden items-center gap-4 border-t px-3 py-2 text-xs md:flex">
      <span className="flex items-center gap-1.5">
        <Kbd>↑</Kbd>
        <Kbd>↓</Kbd>
        {t("hint.move")}
      </span>
      <span className="flex items-center gap-1.5">
        <Kbd>↵</Kbd>
        {t("hint.open")}
      </span>
      <span className="flex items-center gap-1.5">
        <Kbd>esc</Kbd>
        {t("hint.close")}
      </span>
    </div>
  );
};
