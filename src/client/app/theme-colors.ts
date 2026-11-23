/**
 * The browser / status-bar colour per theme: the phone canvas (`--background`
 * below 48rem in styles.css), so the installed app's status bar and splash
 * blend into the page. Keep in step with public/boot.js and the PWA manifest
 * in vite.config.ts (which cannot import this file at runtime).
 */
export const THEME_COLORS = {
  dark: "#07080a",
  light: "#f1f2f5",
} as const;
