import { CURRENCIES } from "@shared/domain/money";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/app/theme";
import type { Theme } from "@/app/theme";
import { ResponsivePicker } from "@/components/form/responsive-picker";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { preferencesQuery } from "@/lib/session";

import { ChoiceSelect } from "./choice-select";
import { CredentialsSheet } from "./credentials-sheet";
import { displayNameSchema } from "./preferences-form/schema";
import {
  RowValueSkeleton,
  SettingsActionRow,
  SettingsRow,
  SettingsSection,
} from "./settings-section";
import { credentialsQuery } from "./settings.queries";
import { useSavePreferences } from "./use-save-preferences";

const THEMES: { value: Theme; icon: typeof Sun }[] = [
  { icon: Monitor, value: "system" },
  { icon: Sun, value: "light" },
  { icon: Moon, value: "dark" },
];

/** Weeks without an odometer reading before the nudge; 0 is off. */
const NUDGE_WEEKS = [0, 1, 2, 3, 4, 6, 8, 12] as const;

const timeZones = (current: string): string[] => {
  const zones = Intl.supportedValuesOf("timeZone");

  return zones.includes(current) ? zones : [current, ...zones];
};

/** Your name, edited in place: saved when you leave the field or press Enter. */
const NameRow = ({
  name,
  onSave,
}: {
  name: string;
  onSave: (name: string) => void;
}) => {
  const { t } = useTranslation("settings");
  const [text, setText] = useState(name);
  const [invalid, setInvalid] = useState(false);

  const commit = () => {
    const parsed = displayNameSchema.safeParse(text);

    if (!parsed.success) {
      setInvalid(true);

      return;
    }

    setInvalid(false);

    if (parsed.data !== name) {
      onSave(parsed.data);
    }
  };

  return (
    <SettingsRow htmlFor="display-name" label={t("preferences.displayName")}>
      <Input
        aria-invalid={invalid}
        autoComplete="name"
        className="h-8 w-44 text-right sm:w-56"
        enterKeyHint="done"
        id="display-name"
        onBlur={commit}
        onChange={(event) => {
          setText(event.target.value);
          setInvalid(false);
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) {
            return;
          }

          if (event.key === "Enter") {
            event.currentTarget.blur();
          }

          if (event.key === "Escape") {
            setText(name);
            setInvalid(false);
          }
        }}
        value={text}
      />
    </SettingsRow>
  );
};

/** Who you are: name (edited in place) and the email you sign in with. */
export const AccountSection = () => {
  const { t } = useTranslation("settings");
  const preferences = useQuery(preferencesQuery);
  const credentials = useQuery(credentialsQuery);
  const { save } = useSavePreferences();
  const [editing, setEditing] = useState(false);

  return (
    <SettingsSection flush title={t("account.title")}>
      {preferences.data === undefined ? (
        <SettingsRow label={t("preferences.displayName")}>
          <RowValueSkeleton />
        </SettingsRow>
      ) : (
        <NameRow
          // Remount when the saved name changes elsewhere (e.g. Undo).
          key={preferences.data.displayName}
          name={preferences.data.displayName}
          onSave={(displayName) => {
            save({ displayName });
          }}
        />
      )}
      <SettingsActionRow
        label={t("security.email")}
        onClick={() => {
          setEditing(true);
        }}
        value={credentials.data?.email ?? <RowValueSkeleton />}
      />
      <CredentialsSheet onOpenChange={setEditing} open={editing} />
    </SettingsSection>
  );
};

const TimeZonePicker = ({
  onChange,
  value,
}: {
  onChange: (zone: string) => void;
  value: string;
}) => {
  const { t } = useTranslation("settings");
  const [open, setOpen] = useState(false);
  const label = t("preferences.timeZone");

  return (
    <ResponsivePicker
      onOpenChange={setOpen}
      open={open}
      renderTrigger={(props) => (
        <Button
          {...props}
          className="max-w-44 sm:max-w-56"
          id="time-zone"
          size="sm"
          type="button"
          variant="field"
        >
          <span className="truncate">{value.replaceAll("_", " ")}</span>
          <ChevronDown className="opacity-60" />
        </Button>
      )}
      title={label}
    >
      <Command>
        <CommandInput placeholder={t("preferences.searchTimeZone")} />
        <CommandList>
          <CommandEmpty>—</CommandEmpty>
          <CommandGroup>
            {timeZones(value).map((zone) => (
              <CommandItem
                data-checked={zone === value}
                key={zone}
                onSelect={() => {
                  setOpen(false);

                  if (zone !== value) {
                    onChange(zone);
                  }
                }}
                value={zone}
              >
                {zone.replaceAll("_", " ")}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </ResponsivePicker>
  );
};

const ThemeControl = () => {
  const { t } = useTranslation("settings");
  const { theme, setTheme } = useTheme();

  return (
    <ToggleGroup
      aria-label={t("preferences.theme")}
      onValueChange={([value]) => {
        const next = THEMES.find((option) => option.value === value);

        if (next) {
          setTheme(next.value);
        }
      }}
      size="segmented"
      spacing={0.5}
      value={[theme]}
      variant="segmented"
    >
      {THEMES.map((option) => (
        <ToggleGroupItem
          aria-label={t(`preferences.themes.${option.value}`)}
          key={option.value}
          value={option.value}
        >
          <option.icon />
          <span className="hidden sm:inline">
            {t(`preferences.themes.${option.value}`)}
          </span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};

/** Language, theme, units, currency, time zone and the odometer nudge; each saves as you pick. */
export const PreferencesSection = () => {
  const { t } = useTranslation("settings");
  const { data: preferences } = useQuery(preferencesQuery);
  const { save } = useSavePreferences();
  const nudge = preferences?.odometerNudgeWeeks ?? 0;

  const nudgeChoices = [...new Set([...NUDGE_WEEKS, nudge])]
    .toSorted((a, b) => a - b)
    .map((weeks) => ({
      label:
        weeks === 0
          ? t("preferences.nudgeOff")
          : t("preferences.nudgeWeeks", { count: weeks }),
      value: String(weeks),
    }));

  return (
    <SettingsSection flush title={t("preferences.title")}>
      <SettingsRow htmlFor="language" label={t("preferences.language")}>
        <ChoiceSelect
          choices={[
            { label: t("languages.en"), value: "en" as const },
            { label: t("languages.mk"), value: "mk" as const },
          ]}
          id="language"
          onChange={(locale) => {
            save({ locale });
          }}
          value={preferences?.locale}
        />
      </SettingsRow>
      <SettingsRow label={t("preferences.theme")}>
        <ThemeControl />
      </SettingsRow>
      <SettingsRow
        htmlFor="distance-unit"
        label={t("preferences.distanceUnit")}
      >
        <ChoiceSelect
          choices={[
            { label: t("units.km"), value: "km" as const },
            { label: t("units.mi"), value: "mi" as const },
          ]}
          id="distance-unit"
          onChange={(distanceUnit) => {
            save({ distanceUnit });
          }}
          value={preferences?.distanceUnit}
        />
      </SettingsRow>
      <SettingsRow htmlFor="currency" label={t("preferences.currency")}>
        <ChoiceSelect
          choices={CURRENCIES.map((code) => ({ label: code, value: code }))}
          id="currency"
          onChange={(currency) => {
            save({ currency });
          }}
          value={preferences?.currency}
        />
      </SettingsRow>
      <SettingsRow htmlFor="time-zone" label={t("preferences.timeZone")}>
        {preferences === undefined ? (
          <RowValueSkeleton />
        ) : (
          <TimeZonePicker
            onChange={(timeZone) => {
              save({ timeZone });
            }}
            value={preferences.timeZone}
          />
        )}
      </SettingsRow>
      <SettingsRow
        description={t("preferences.nudgeHelp")}
        htmlFor="odometer-nudge"
        label={t("preferences.nudge")}
      >
        <ChoiceSelect
          choices={nudgeChoices}
          id="odometer-nudge"
          onChange={(weeks) => {
            save({ odometerNudgeWeeks: Number(weeks) });
          }}
          value={String(nudge)}
        />
      </SettingsRow>
    </SettingsSection>
  );
};
