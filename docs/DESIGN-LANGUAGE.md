# LifeStash — design language (v0.3 "crisp")

Flat surfaces, hairlines, one accent, fast. The visual reference is the "LifeStash Design Language" canvas (Tokens board); this file is the source of truth for code.

## Principles

1. **Hairlines, not shadows.** Borders separate things. Only overlays (dialogs, menus, popovers) get a shadow.
2. **One accent.** Blue (`primary`) marks the primary action, links and focus. Everything else is greyscale. Icons and avatars are neutral, not tinted.
3. **Lists over cards.** Content is rows under a small heading (`ListSection`). Boxes (`Panel`) only frame charts, tables and form fields.
4. **Status is a shape.** `StatusRing` fills as a reminder comes due; overdue is a solid "!" disc, done is a check. Colour is the second cue.
5. **13px is the base on desktop, 14px on touch.** Hierarchy comes from weight and grey level, not size jumps.
6. **Fast by default.** 100 ms hover, 150 ms dialogs, 120 ms menus, 100 ms exits, no bounce. Every frequent action has a key.

## Tokens (`src/client/styles.css`)

| Token | Use |
| --- | --- |
| `background` / `card` | canvas / raised surface (white in light mode) |
| `accent` | hover and selected surfaces (sidebar item, pill tab, menu row) |
| `border` / `divider` | outer hairlines / row separators inside a box |
| `foreground`, `subtle-foreground`, `muted-foreground` | text levels (primary, secondary, tertiary) |
| `primary` | the one accent |
| `destructive`, `warning`, `success` | status; use `warning-foreground` for warning **text** |
| `chart-1…5` | blue ramp (chart-5 is a dark navy for a fourth series) |

Radii: `--radius` is 0.5rem, giving `rounded-sm` 4 · `md` 6 · `lg` 8 · `xl` 12. Shadows: `shadow-xs`/`sm` are none; `shadow-md`/`lg`/`xl` are the overlay shadow. Font: Inter Variable (self-hosted, optical sizing, `cv11 ss01 ss03`).

All of this is set at the theme level, so shadcn components stay unedited. When a design needs something new, add a **variant** in `components/ui` (examples: `Button` `compact` / `icon-compact`, `Toggle` `segmented`, `TabsList` `pill`).

## Layout

- **Desktop:** the sidebar (household menu, search, Overview / Reminders / History / Service catalog, the car list, Settings) sits on the canvas; pages render inside one white bordered panel. `PageHeader` draws a 44px bar at the top of the panel (crumb › title, actions).
- **Phones:** a Garage / Reminders / Settings bottom bar. `PageHeader` draws a top row (back or `mobileTop`, actions) above a large title.
- **Lists vs padded pages:** list pages wrap content in `PageStack`. A `ListSection` there is a grey band heading with full-width rows on desktop (it carries `data-bleed`) and an inset box on phones; any other child gets a desktop margin. Form, settings and catalog pages use `PageContent` (padded, max 4xl).
- The Garage home and the household Reminders page read `GET /api/garage/overview` (household name, reminders across cars, monthly spending, totals, km this year) — one request for the whole page.

## Building blocks (`src/client/components/app`)

| Component | When |
| --- | --- |
| `ListSection`, `ListRow`, `ListRowText` | any list: heading + count + action, rows 56px touch / 40px desktop |
| `SectionHeading` | a heading above a box when you build the box yourself |
| `Panel` | a box for charts, tables, form fields; optional title and description |
| `StatPanel`, `Stat` | exactly 2 or 4 figures side by side (odd counts leave a gap: use a list) |
| `StatusRing` + `STATUS_TEXT_TONE` | reminder status; progress from `reminderProgress` (shared domain) |
| `CarMonogram` (garage) | car initials in a neutral square |
| `SettingsSection` (settings) | settings group: title/description left, box right |
| `Kbd` (`components/ui`) | key hints; hide on touch with `hidden md:inline-flex` |
| `DialogContent variant="bare"` | dialogs with their own header and footer (log reading) |
| `CompleteReminderButton variant` | `button`, `circle` (phones) or `hover` ("Mark done" on desktop row hover) |

## Keyboard

- ⌘K / Ctrl+K or `/` opens the command menu (scoped to the car you are on) (`CommandMenuProvider` in the app shell; `useCommandMenu().open()` from buttons).
- Single-key shortcuts live in `lib/shortcuts.ts` and are bound with `useHotkey`, which ignores keys while typing, with modifiers, or while a dialog is open. Car page: L odometer, S service, E expense, R reminder. Garage: C add car. Show the key with `Kbd` on the matching button.

## Rules of thumb

- Primary actions use `size="compact"`; icon buttons in rows use `size="icon-compact"`.
- Horizontal strips that scroll on phones use `scrollbar-none` and `-mx-4 px-4` to bleed to the screen edge.
- Prefer one meta line (`a · b · c`, `tabular-nums`) over badges.
