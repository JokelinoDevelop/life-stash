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
| `destructive`, `warning`, `success` | status; use `warning-foreground` / `success-foreground` for warning / success **text** (income amounts) |
| `chart-1…5` | blue ramp (chart-5 is a dark navy for a fourth series) |

Radii: `--radius` is 0.5rem, giving `rounded-sm` 4 · `md` 6 · `lg` 8 · `xl` 12. Shadows: `shadow-xs`/`sm` are none; `shadow-md`/`lg`/`xl` are the overlay shadow. Font: Inter Variable (self-hosted, optical sizing, `cv11 ss01 ss03`).

All of this is set at the theme level, so shadcn components stay unedited. When a design needs something new, add a **variant** in `components/ui` (examples: `Button` `compact` / `icon-compact` / `chip` (rounded suggestion pill, `aria-pressed` when chosen), `Toggle` `segmented`, `TabsList` `pill`, `SelectTrigger` size `chip` (filter chips) and variant `ghost` (plain "EUR · tap to change")).

## Layout

- **Desktop:** the sidebar (household menu, search, the **Garage** and **Finances** module groups — the active one expanded with its pages, the car list under Garage — then Reminders and Settings at the bottom) sits on the canvas; pages render inside one white bordered panel. `PageHeader` draws a 44px bar at the top of the panel (crumb › title, actions).
- **Phones:** a Garage / Finances / Reminders / Settings bottom bar. `PageHeader` draws a top row (back or `mobileTop`, actions) above a large title. Pages the sidebar links to that the bottom bar has no room for (History, Service catalog) are listed under "Browse" at the end of the Garage home (`BrowseLinks`), and get a back arrow to Garage.
- **Lists vs padded pages:** list pages (including the Service catalog) wrap content in `PageStack`. A `ListSection` there is a grey band heading with full-width rows on desktop (it carries `data-bleed`) and an inset box on phones; any other child gets a desktop margin. Form and settings pages use `PageContent` (padded, max 4xl).
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
| `DialogContent variant="bare"` | dialogs with their own header and footer; `size="lg"` for long forms |
| `FormDialog` + `DialogForm` / `FormSection` / `FormNotice` | every create/edit form (see "Forms and dialogs") |
| `DatePicker` / `field.DateField` (`components/form`) | every date: shadcn calendar in a popover, Today / Yesterday, typed `19.11.2026`; `variant="chip"` inline |
| `LoadingState` (`list` / `rows` / `block`), `FormSkeleton`, `ErrorState`, `EmptyState` | in-between states (see below) |
| `CompleteReminderButton variant` | `button`, `circle` (phones) or `hover` ("Mark done" on desktop row hover) |
| `useConfirm()` (`components/app/confirm`) | imperative yes/no: `await confirm({ title, tone })` |
| `useAppMutation` (`lib/mutation`) | every mutation: one toast, optional Undo / action, invalidation |
| `PagedList` + `paginate` (`lib/paginate`) | any list that can grow past a screen: 12 rows a page, "‹ Newer · 13–24 of 79 · Older ›" |
| `DrawerHeader align="start"` | sheet titles read top-left like their dialogs |

## Forms and dialogs

- Create and edit always open in a dialog over the current page (bottom sheet on phones), never a page. There are no `/new` or `/edit` routes.
- The open dialog lives in the URL on the `_app` route: `?dialog=car|service|expense|reminder`, plus `car`, `id` (edit) and `reminder` (the reminder a new entry completes). Open one with `EntryDialogLink` (keeps ⌘-click / new tab) or `useEntryDialog().open(...)`; `EntryDialogHost` in the app shell renders it. Back closes a dialog opened in-app; a deep link closes by dropping the keys.
- Layout: a 44px crumb bar (car monogram › title, ×), a scrolling body split into `FormSection`s by hairlines, and a pinned footer (`form.FormFooter`): `esc to cancel` or a slot such as Delete on the left, Cancel and Save `⌘↵` on the right. ⌘↵ / Ctrl+↵ submits from anywhere in the dialog.
- The dialog opens on the first field. Closing with unsaved changes asks "Discard changes?". After a save: one toast, close, stay on the page (a new service offers "View" in the toast; a new car opens its page).
- Edit dialogs load their own data and show `FormSkeleton` meanwhile, or `ErrorState` with retry.
- Native `<input type="date">` is not used anywhere.

## In-between states

- **Loading:** skeletons shaped like the content they replace (`LoadingState` list rows, `FormSkeleton` fields). They fade in after 150 ms (`animate-reveal`), so fast loads show nothing. Never a spinner for a whole page.
- **Navigating:** the current page stays up; a 2px progress bar runs along the top of the panel after 150 ms. A route only swaps to the pending skeleton after 800 ms.
- **Refetching:** keep the old data on screen (`placeholderData: keepPreviousData`) instead of returning to a skeleton.
- **Saving:** the Save button keeps its label and width; a small spinner replaces the `⌘↵` hint and the button is disabled.
- **Empty:** a neutral 40px icon tile, optional title, one line of help and the main action (with its key hint). No dashed boxes.
- **Errors:** inline where the content would be: icon, "Couldn't load this", the reason and Retry. A failed route shows the same, centred, via the router's `defaultErrorComponent`.

## Long lists

- Lists that grow with time (car History, Mileage readings, Expenses, the household History) show **12 rows a page** with `PagedList`. The page lives in the URL (`?page=2`, absent on page 1) so refresh and Back from a detail return to it; switching car tabs starts at page 1. Turning the page scrolls back to the top of the list.
- Paginate the flat, sorted list, then group the page (by year or month). A group heading's count and total describe the **whole** group, even when it continues on the next page.
- Rows under a year or month heading use `format.shortDate` ("19.07"), so the meta line keeps room for the odometer and kind instead of repeating the year.
- Summaries above a list stay compact: a strip (Expenses "This year by category") rather than a row per entry. Side lists cap at 8 with "Show all N".
- The Service catalog is a filterable list: filter text + Active / Archived. Whole rows open the edit dialog; archive / delete live in that dialog's footer. Items show usage (times done, last done) as right-aligned columns on desktop and in the meta line on phones. N new item, P new package.

## Keyboard

- ⌘K / Ctrl+K or `/` opens the command menu (scoped to the car you are on) (`CommandMenuProvider` in the app shell; `useCommandMenu().open()` from buttons).
- Single-key shortcuts live in `lib/shortcuts.ts` and are bound with `useHotkey`, which ignores keys while typing, with modifiers, or while a dialog is open. Car page: L odometer, S service, E expense, R reminder. Garage: C add car. Service catalog: N new item, P new package. Show the key with `Kbd` on the matching button.

## Rules of thumb

- Primary actions use `size="compact"`; icon buttons in rows use `size="icon-compact"`.
- Horizontal strips that scroll on phones use `scrollbar-none` and `-mx-4 px-4` to bleed to the screen edge.
- Prefer one meta line (`a · b · c`, `tabular-nums`) over badges.
