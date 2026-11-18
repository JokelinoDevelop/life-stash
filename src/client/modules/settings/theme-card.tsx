import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/app/theme";
import type { Theme } from "@/app/theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const THEMES: { value: Theme; icon: typeof Sun }[] = [
  { icon: Monitor, value: "system" },
  { icon: Sun, value: "light" },
  { icon: Moon, value: "dark" },
];

export const ThemeCard = () => {
  const { t } = useTranslation("settings");
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("preferences.theme")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ToggleGroup
          className="w-full"
          onValueChange={(value) => {
            const next = THEMES.find((option) => option.value === value);

            if (next) {
              setTheme(next.value);
            }
          }}
          type="single"
          value={theme}
          variant="outline"
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
      </CardContent>
    </Card>
  );
};
