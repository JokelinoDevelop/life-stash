import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Theme = "system" | "light" | "dark";

const STORAGE_KEY = "lifestash.theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  setTheme: () => {
    // Replaced by the provider.
  },
  theme: "system",
});

const readStoredTheme = (): Theme => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);

    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
};

const applyTheme = (theme: Theme) => {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? "#151b26" : "#f7f9fc");
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const onChange = () => {
      applyTheme(theme);
    };

    media.addEventListener("change", onChange);

    return () => {
      media.removeEventListener("change", onChange);
    };
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      setTheme: (next) => {
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch {
          // Storage unavailable: the theme still applies for this session.
        }

        setTheme(next);
      },
      theme,
    }),
    [theme]
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
};

export const useTheme = () => useContext(ThemeContext);
