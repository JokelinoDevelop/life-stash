import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/app/theme";
import type { Theme } from "@/app/theme";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { SettingsSection } from "./settings-section";

const THEMES: { value: Theme; icon: typeof Sun }[] = [
  { icon: Monitor, value: "system" },
  { icon: Sun, value: "light" },
  { icon: Moon, value: "dark" },
];

export const ThemeCard = () => {
  const { t } = useTranslation("settings");
  const { theme, setTheme } = useTheme();

  return (
    <SettingsSection title={t("preferences.theme")}>
      <ToggleGroup
        className="w-full sm:w-fit"
        onValueChange={(value) => {
          const next = THEMES.find((option) => option.value === value);

          if (next) {
            setTheme(next.value);
          }
        }}
        size="segmented"
        spacing={0.5}
        type="single"
        value={theme}
        variant="segmented"
      >
        {THEMES.map((option) => (
          <ToggleGroupItem
            className="flex-1"
            key={option.value}
            value={option.value}
          >
            <option.icon />
            {t(`preferences.themes.${option.value}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </SettingsSection>
  );
};
