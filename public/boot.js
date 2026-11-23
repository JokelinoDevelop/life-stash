// Runs before first paint (a blocking classic script, since the CSP forbids
// inline ones): applies the stored theme and UI size so the page never flashes
// light-then-dark or reflows from one size to the other. Keep in step with
// src/client/app/theme.tsx and src/client/app/density.ts.
{
  const root = document.documentElement;
  let theme = null;
  let density = null;

  try {
    theme = localStorage.getItem("lifestash.theme");
    density = localStorage.getItem("lifestash.density");
  } catch {
    // Storage unavailable: defaults apply.
  }

  const dark =
    theme === "dark" ||
    (theme !== "light" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  root.classList.toggle("dark", dark);
  root.dataset.density = density === "compact" ? "compact" : "comfortable";
  document
    .querySelector('meta[name="theme-color"]')
    // THEME_COLORS in src/client/app/theme-colors.ts (the phone canvas).
    ?.setAttribute("content", dark ? "#070709" : "#f2f2f4");
}
