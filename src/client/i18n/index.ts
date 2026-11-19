import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import enAuth from "./en/auth.json";
import enCommand from "./en/command.json";
import enCommon from "./en/common.json";
import enFinances from "./en/finances.json";
import enGarage from "./en/garage.json";
import enGarageCatalog from "./en/garageCatalog.json";
import enGarageExpenses from "./en/garageExpenses.json";
import enGarageMileage from "./en/garageMileage.json";
import enGarageReminders from "./en/garageReminders.json";
import enGarageSpending from "./en/garageSpending.json";
import enGarageVisits from "./en/garageVisits.json";
import enSettings from "./en/settings.json";
import mkAuth from "./mk/auth.json";
import mkCommand from "./mk/command.json";
import mkCommon from "./mk/common.json";
import mkFinances from "./mk/finances.json";
import mkGarage from "./mk/garage.json";
import mkGarageCatalog from "./mk/garageCatalog.json";
import mkGarageExpenses from "./mk/garageExpenses.json";
import mkGarageMileage from "./mk/garageMileage.json";
import mkGarageReminders from "./mk/garageReminders.json";
import mkGarageSpending from "./mk/garageSpending.json";
import mkGarageVisits from "./mk/garageVisits.json";
import mkSettings from "./mk/settings.json";

export const resources = {
  en: {
    auth: enAuth,
    command: enCommand,
    common: enCommon,
    finances: enFinances,
    garage: enGarage,
    garageCatalog: enGarageCatalog,
    garageExpenses: enGarageExpenses,
    garageMileage: enGarageMileage,
    garageReminders: enGarageReminders,
    garageSpending: enGarageSpending,
    garageVisits: enGarageVisits,
    settings: enSettings,
  },
  mk: {
    auth: mkAuth,
    command: mkCommand,
    common: mkCommon,
    finances: mkFinances,
    garage: mkGarage,
    garageCatalog: mkGarageCatalog,
    garageExpenses: mkGarageExpenses,
    garageMileage: mkGarageMileage,
    garageReminders: mkGarageReminders,
    garageSpending: mkGarageSpending,
    garageVisits: mkGarageVisits,
    settings: mkSettings,
  },
} as const;

export const LOCALES = ["en", "mk"] as const;

export type Locale = (typeof LOCALES)[number];

const LOCALE_STORAGE_KEY = "lifestash.locale";

const i18n = createInstance();

const storedLocale = (): Locale | null => {
  try {
    const value = localStorage.getItem(LOCALE_STORAGE_KEY);

    return value === "en" || value === "mk" ? value : null;
  } catch {
    return null;
  }
};

const browserLocale = (): Locale =>
  navigator.language.toLowerCase().startsWith("mk") ? "mk" : "en";

export const setLocale = async (locale: Locale): Promise<void> => {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Storage can be unavailable (private mode); the language still switches for this session.
  }

  document.documentElement.lang = locale;
  await i18n.changeLanguage(locale);
};

const initialLocale = storedLocale() ?? browserLocale();

document.documentElement.lang = initialLocale;

await i18n.use(initReactI18next).init({
  defaultNS: "common",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  lng: initialLocale,
  resources,
});
