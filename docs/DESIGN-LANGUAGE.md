# LifeStash — design language (v0.5 "clear + touch")

Flat surfaces, hairlines, one accent, fast. The visual reference is the "LifeStash Design Language" canvas (Tokens board); this file is the source of truth for code.

v0.5 adds a **phone layer** (below 48rem): grouped lists on a darker canvas, a floating tab bar, one hero per screen, tinted category icons and native-feeling motion. Desktop is unchanged. Where the phone rules depart from a principle below, the principle says so and "Phones (v0.5)" has the details.

## Principles

1. **Hairlines, not shadows.** Borders separate things. Only overlays (dialogs, menus, popovers) get a shadow. _Phones depart:_ cards drop their outline and sit on a darker canvas (row dividers stay); the floating tab bar and the done tick carry a soft shadow.
2. **One accent.** Indigo (`primary`, in the spirit of Linear; neutrals lean very slightly violet) marks the primary action, links and focus. Everything else is greyscale. Icons and avatars are neutral, not tinted. _Phones depart:_ category icons (Transactions, car Timeline, To confirm) take a tint from a small fixed palette, and a car without a photo gets a hero gradient in its own tint. Tints never mark actions or status; the indigo still does.
3. **Lists over cards.** Content is rows under a small heading (`ListSection`). Boxes (`Panel`) only frame charts, tables and form fields.
4. **Status is a shape.** Four shapes only: an empty ring (later), a ring with a dot (due soon), a solid "!" disc (overdue), a check (done). No partial fills. Colour is the second cue.
5. **15px is the base** on desktop and on touch (the default "comfortable" size; ⌘K switches to "compact": 13/14px and tighter spacing, via `data-density` in `styles.css`). Phones keep the native 4px grid in comfortable, so about eight two-line rows fit a screen. Hierarchy comes from weight and grey level, not size jumps, except the one hero figure per phone screen (see "Phones (v0.5)").
6. **Fast by default.** 100 ms hover, 150 ms dialogs, 120 ms menus, 100 ms exits, no bounce. Every frequent action has a key, but only the page's primary button shows its key hint; the rest are found in ⌘K.
7. **One word per idea.** Creating anything is **Add …** (Add car, Add service, Add transaction, Add invoice). Things that come due are **Reminders**. Everything that needs you now is **Today**. Copy talks about what the user sees ("transactions"), never how it's stored ("ledger").

## Tokens (`src/client/styles.css`)

| Token | Use |
| --- | --- |
| `background` / `card` | canvas / raised surface (white in light mode) |
| `accent` | hover and selected surfaces (sidebar item, pill tab, menu row) |
| `border` / `divider` | outer hairlines / row separators inside a box |
| `foreground`, `subtle-foreground`, `muted-foreground` | text levels (primary, secondary, tertiary) |
| `primary` | the one accent |
| `destructive`, `warning`, `success` | status; use `warning-foreground` / `success-foreground` for warning / success **text** (income amounts) |
| `chart-1…5` | indigo ramp (chart-5 is a deep indigo for a fourth series) |
| `tint-blue…slate` | phone category icons and car hero gradients (`TINTS` / `TINT_TILE` in `components/app/tint.ts`); tuned per theme |

Radii: `--radius` is 0.5rem, giving `rounded-sm` 4 · `md` 6 · `lg` 8 · `xl` 12. Phones: surfaces (`surface` utility) and sheets are 16px. Shadows: `shadow-xs`/`sm` are none; `shadow-md`/`lg`/`xl` are the overlay shadow. Font: Inter Variable (self-hosted, optical sizing, `cv11 ss01 ss03`).

Utilities in `styles.css`: `surface` (a card, list box or panel: hairline + 8px on desktop, no outline + 16px on phones), `money-code` (the smaller, lighter currency in `Money`), `tabbar-float`, `pb-safe-*` / `pt-safe-*` (spacing plus the safe-area inset), `auth-glow`, `car-hero-*`, `animate-done-tick`.

All of this is set at the theme level, so shadcn components stay unedited. When a design needs something new, add a **variant** in `components/ui` (examples: `Button` `compact` / `icon-compact` / `chip` (rounded suggestion pill, `aria-pressed` when chosen), `Toggle` `segmented`, `TabsList` `pill`, `SelectTrigger` size `chip` (filter chips) and variant `ghost` (plain "EUR · tap to change"), `Button` sizes `submit` (a form's primary: full-width 48px on phones, compact on desktop) and `block` (full-width 48px on phones, default on desktop: sign-in screens), `Button` variant `glass` (frosted, over a photo)).

## Layout

- **Desktop:** the sidebar sits on the canvas: the household name (a label), search, **Today** (with its count: red when something is overdue), then the **Garage** (cars first, then Service history and Service catalog) **Finances** (Transactions, Invoices, Clients) and **Fitness** (Trainings, Weight) groups, always open; the group name opens the module's overview and its chevron collapses it by hand (remembered in `localStorage`). The account menu sits at the bottom (your name; opens Settings and Log out, which asks to confirm) — the only desktop way into Settings besides ⌘K. On phones Settings is the bottom-bar tab and Log out is the last thing on the Settings page (never a header action). Badges follow one rule: a number means "needs action", red only when overdue; a car with an overdue reminder shows a small red "!".
- Pages render inside one white bordered panel; below the 44px `PageHeader` bar (crumb › title, actions) the content uses the full panel width (no centred column); a side panel such as the car details keeps a fixed width beside a flexible main column. Module home pages are titled with the module name, not "Overview".
- **Phones:** a Today / Garage / Finances / Fitness / Settings bottom bar (Today carries the count), floating above the home indicator (see "Phones (v0.5)"). `PageHeader` draws a top row (back or `mobileTop`, actions) above a large title. Pages the sidebar links to that the bottom bar has no room for (Service history, Service catalog) are listed under "Browse" at the end of the Garage home (`BrowseLinks`), and get a back arrow to Garage.
- **Today** (`/`) lists what needs action across modules: recurring income to confirm, then Overdue / Next 30 days / Later, mixing reminders and unpaid invoices sorted by days left ("Later" shows 3 with "Show all"). Garage home shows only overdue and next-30-day reminders with a link to Today.
- **Lists vs padded pages:** list pages (including the Service catalog) wrap content in `PageStack`. A `ListSection` there is a grey band heading with full-width rows on desktop (it carries `data-bleed`) and an inset box on phones; any other child gets a desktop margin. Form and settings pages use `PageContent` (padded, full width).
- The Garage home and Today read `GET /api/garage/overview` (household name, reminders across cars, monthly spending, totals, km this year) — one request for the whole page.

## Building blocks (`src/client/components/app`)

| Component | When |
| --- | --- |
| `ListSection`, `ListRow`, `ListRowText` | any list: heading + count + action, rows 52px touch / 40px desktop; `ListRow swipe` adds phone swipe actions, `after` renders beside the row (a dialog it opens) |
| `Money` (`components/app/money`) | any amount where the figure should lead: the currency is smaller and lighter on phones, plain text on desktop; `variant="ledger"` keeps cents, `sign` prefixes + / − |
| `SwipeActions` (`components/app/swipe-actions`) | phone swipe-left actions on a row; the tap path still works. `SwipeToDelete` is built on it |
| `useScrub` + `ScrubRange` | tap or drag across a bar chart to read one month; the hidden range input gives keyboard and screen-reader access |
| `showDoneTick()` (`lib/done-tick`) + `DoneTickHost` | the check that draws itself when an entry completes a reminder, with a success haptic |
| `haptic()` (`lib/haptics`) | a short vibration where supported (Android); a no-op on iOS |
| `CarHero` (garage) | phone car header: photo or tinted gradient, name and plate, photo menu |
| `AllClear` (today) | Today with nothing to do; `compact` above a Later-only list |
| `SectionHeading` | a heading above a box when you build the box yourself |
| `Panel` | a box for charts, tables, form fields; optional title and description |
| `StatPanel`, `Stat` | exactly 2 or 4 figures side by side (odd counts leave a gap: use a list) |
| `StatusRing` + `STATUS_TEXT_TONE` | reminder status (four shapes, see principle 4) |
| `CarMonogram` (garage) | car initials in a neutral square (desktop car header, rows) |
| `SettingsSection` (settings) | settings group: title/description left, box right |
| `Kbd` (`components/ui`) | key hints; hide on touch with `hidden md:inline-flex` |
| `DialogContent variant="bare"` | dialogs with their own header and footer; `size="lg"` for long forms |
| `FormDialog` + `DialogForm` / `FormSection` / `FormNotice` | every create/edit form (see "Forms and dialogs") |
| `AmountInput` (`components/form`) | the big amount at the top of every money dialog |
| `FormDisclosure` (`components/form`) | "› More details": rare optional fields, open when editing a record that has them |
| `DatePicker` / `field.DateField` (`components/form`) | every date: shadcn calendar in a popover, Today / Yesterday, typed `19.11.2026`; `variant="chip"` inline |
| `LoadingState` (`list` / `rows` / `block`), `FormSkeleton`, `ErrorState`, `EmptyState` | in-between states (see below) |
| `CompleteReminderButton variant` | `button`, `circle` (phones) or `hover` ("Mark done" on desktop row hover) |
| `useConfirm()` (`components/app/confirm`) | imperative yes/no: `await confirm({ title, tone })` |
| `useAppMutation` (`lib/mutation`) | every mutation: one toast, optional Undo / action, invalidation |
| Toasts (sonner) | small neutral cards, Linear-style: status only in the icon colour, one line, a quiet action button; bottom-right on desktop, a narrow card centred above the tab bar on phones (styles in `styles.css`) |
| `PagedList` + `paginate` (`lib/paginate`) | any list that can grow past a screen: 12 rows a page, "‹ Newer · 13–24 of 79 · Older ›" |
| `DrawerHeader align="start"` | sheet titles read top-left like their dialogs |

## Forms and dialogs

- Create and edit always open in a dialog over the current page (bottom sheet on phones), never a page. There are no `/new` or `/edit` routes.
- The open dialog lives in the URL on the `_app` route: `?dialog=car|service|expense|reminder`, plus `car`, `id` (edit) and `reminder` (the reminder a new entry completes). Open one with `EntryDialogLink` (keeps ⌘-click / new tab) or `useEntryDialog().open(...)`; `EntryDialogHost` in the app shell renders it. Back closes a dialog opened in-app; a deep link closes by dropping the keys.
- Layout: a 44px crumb bar (car monogram › title, ×), a scrolling body split into `FormSection`s by hairlines, and a pinned footer (`form.FormFooter`): `esc to cancel` or a slot such as Delete on the left, Cancel and Save `⌘↵` on the right. ⌘↵ / Ctrl+↵ submits from anywhere in the dialog. On phones the footer is one full-width 48px Save (sheets close by swiping down, so no Cancel), with Delete or a secondary action beside it; sheets that use `SubmitButton` (Skip) match it with `size="submit"`.
- **Money dialogs share one order:** amount (`AmountInput`) → what it was for (category chips) → when (date chip) → the rest. Finances › Add transaction and Garage › Add expense both follow it.
- **Common case first.** Rare options sit behind a link or `FormDisclosure`: the date field shows "Only know the month or year?" instead of the Exact / Month / Year toggle; the service form keeps shop, previous owner and notes under "More details".
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

## Motion

Subtle by default: motion explains a change the user just made; it never decorates, and nothing moves on its own. Opacity over movement — no slides, no rises (_phones depart_ for navigation and gestures, below). Tokens in `styles.css`: `--motion-fast` 100 ms (hover, press, exits, indicators), `--motion-base` 150 ms (overlays, content fading in), on `--ease-out`; `--motion-slide` 280 ms on `--ease-slide` for the phone drill-down slide-in (the same curve as swipe-back). `prefers-reduced-motion` turns them all off, including scroll-driven effects.

- **Pages:** on desktop, when the path changes the content panel cross-fades (150 ms, no movement) via the View Transitions API (`defaultViewTransition` in `main.tsx`, `view-transition-name: page` in `PageOutlet`). **Phones use no view transitions** (they freeze the screen on snapshots until the next page renders and fight iOS's own back swipe): a page you drill into slides in from the right as it renders (`animate-page-enter` on the live page, `phonePageEnters` in `lib/nav-transition`), so it can be tapped and scrolled at once; Back, tab-bar switches and tabs inside a page (Settings) are instant, as in iOS. Search-only changes (dialogs, tabs, filters, pages of a list) never animate. Sidebar and bottom bar stay still.
- **Lists:** static by default. Only short lists the user edits in place animate rows in and out: `ListRows animated` / `OverviewSection animated` ("To confirm"), `MotionList` / `useListMotion()` (service items editor, categories, recurring, attachments). Data lists that refetch, filter or page (transactions, timeline, invoices, Today) never animate.
- **Optimistic:** quick, reversible mutations update the cache before the request (`optimistic: [optimisticUpdate(key, fn)]` on `useAppMutation`); errors roll back (or refetch, when other mutations are in flight). Never empty a page optimistically: wait for the server instead. Used for Confirm / Skip recurring income and deleting a transaction.
- **Figures:** headline numbers in `Stat`s roll to a new value only when it changes after the page has settled (`AnimatedMoney`, `AnimatedTotals`, `AnimatedDistance`, `AnimatedCount`), on phones too; multi-currency totals stay plain text so they can truncate.
- **Tabs:** pill tabs slide one indicator (100 ms); panels swap without animation.
- **Small things:** buttons scale to .985 while pressed; disclosures and empty states fade in (`animate-fade`); chevrons rotate.
- **Phone gestures:** rows swipe left to reveal actions (200 ms settle, a haptic tick when the swipe will open); charts scrub with a haptic tick per month; completing a reminder shows the done tick (900 ms) with a success haptic. Phone rows darken (`accent`) while pressed.

## Long lists

- Every long list uses the same pager (`PagedList`: "‹ Newer · 13–24 of 79 · Older ›"). Lists built on the client (car Timeline, the household history) show **12 rows a page**; Transactions pages through the API, 25 at a time. Short capped lists (Today's "Later", paid invoices, "Last done") use "Show all N" / "Show less". The page lives in the URL (`?page=2`, absent on page 1) so refresh and Back from a detail return to it; switching car tabs or the Timeline filter starts at page 1. Turning the page scrolls back to the top of the list.
- **Car page tabs:** Overview · Timeline (services, expenses and odometer readings in one list, filter All / Services / Expenses / Odometer in `?show=`) · Reminders · Details (car facts, mileage, costs, last done per item). Old `?tab=history|mileage|expenses|spending` links redirect.
- Paginate the flat, sorted list, then group the page (by year or month). A group heading's count and total describe the **whole** group, even when it continues on the next page.
- Rows under a year or month heading use `format.shortDate` ("19.07"), so the meta line keeps room for the odometer and kind instead of repeating the year.
- Summaries above a list stay compact: a strip (Expenses "This year by category") rather than a row per entry. Side lists cap at 8 with "Show all N".
- The Service catalog is a filterable list: filter text + Active / Archived. Whole rows open the edit dialog; archive / delete live in that dialog's footer. Items show usage (times done, last done) as right-aligned columns on desktop and in the meta line on phones. N new item, P new package.

## Keyboard

- ⌘K / Ctrl+K or `/` opens the command menu (scoped to the car you are on) (`CommandMenuProvider` in the app shell; `useCommandMenu().open()` from buttons).
- Single-key shortcuts live in `lib/shortcuts.ts` and are bound with `useHotkey`, which ignores keys while typing, with modifiers, or while a dialog is open. Car page: L odometer (opens the reading dialog on Timeline), S service, E expense, R reminder. Garage: C add car. Service catalog: N add item, P add package. Show the key with `Kbd` on the page's primary button only.

## Phones (v0.5)

Everything here applies below 48rem only; desktop renders exactly as before.

- **Canvas and surfaces:** the canvas is a shade darker (light `#f2f2f4`, dark `#070709`) and cards are white (dark: a raised grey) without an outline, 16px radius, like a native grouped list. Row dividers stay. Pill tabs show the active tab as a raised white chip; sheets are white with a 16px top radius and a 36 × 4 grabber, and never draw a focus ring around the whole sheet.
- **Density and targets:** comfortable keeps 4px spacing and a 15px body; rows are 52px, icon buttons, compact buttons and form fields 44px.
- **One hero per screen:** Today shows the date above the title and one summary line (overdue in red, due soon, money waiting). Garage's spending and Finances' net figures are 36px. A car page opens on `CarHero`. Everything else keeps the 15px scale.
- **Header actions:** one pattern: bare 44px icon buttons (search, +, …). No labelled buttons in the phone top row; Log out lives at the end of Settings.
- **Rows:** the title always wins. Long status ("10 days ago · 1,232 km over") moves into the meta line in its status colour, so the trailing slot holds at most a short figure (an amount). Transactions and Timeline amounts use `Money`, so "−MKD" reads as a light prefix.
- **Swipe actions:** reminder rows (Skip, Done), unpaid invoices (Mark paid), recurring income to confirm (Skip, Confirm), transactions (Delete). They reuse the same dialogs, mutations, confirmations and toasts as the tap path, which keeps working.
- **Tab bar:** Linear-style: an icon-only capsule of the five sections (labels are `aria-label`s) with Quick add as its own round button beside it, floating 12px above the home indicator (`tabbar-float`, `tabbar-glass`: frosted, nearly opaque). The page fades and blurs progressively into the canvas near the bottom edge (`tabbar-edge`), so rows never show through the bar. The current tab sits on a tinted pill in the accent colour. It keeps `view-transition-name: tabbar`, so it never animates with the page.
- **Sheet footers with several actions** (an issued invoice): the main action full width, the rest in a "…" menu beside it.
- **Sign-in screens** never auto-focus a field on phones (the keyboard would cover the screen on load).
- **Keyboard (Android):** the page shrinks when the keyboard opens (`interactive-widget=resizes-content` in `index.html`), so sheets (80dvh) keep Save above it; the tab bar hides while a page field has focus; `scroll-padding-bottom` keeps scrolled-to fields clear of the tab bar.
- **Charts:** the Garage spending and Finances net cards scrub (tap or drag); Finances shows month initials and a readout line for the chosen month.
- **Tints:** a fixed palette of eight (`tint-*`), one per category icon (`categoryTint`, expense categories) or car (`carTint`), as a 15% tile with the tint as the icon colour.
- **Installed app:** the manifest, `index.html`, `boot.js` and the theme switch share `THEME_COLORS` (the phone canvas), so the status bar and splash match the page in both themes (Chrome also reads the manifest's dark-scheme override).
- **Sign-in screens:** no card on phones: the mark and name in a row on a soft accent glow, a large title, a full-width form with 48px buttons, all in the optical centre of the screen.

## Rules of thumb

- Primary actions use `size="compact"`; icon buttons in rows use `size="icon-compact"`. A form's Save uses `size="submit"` (FormFooter does this for you).
- Boxes use the `surface` utility with their `rounded-lg border`, so they become borderless grouped cards on phones.
- Horizontal strips that scroll on phones use `scrollbar-none` and `-mx-4 px-4` to bleed to the screen edge.
- Prefer one meta line (`a · b · c`, `tabular-nums`) over badges. On phones keep it to the two or three facts that fit without truncating (put the date before free text such as a client name); the rest can be desktop-only.
- **Summary lines** (a page description, Today's line) show one figure for money: `useSummaryTotals` (finances) gives "≈ MKD 586,320" in the main currency when every rate is known, otherwise the main currency first. Exact per-currency amounts stay in rows and tables.
- **Settings lists** use `layout="row"` on `field.TextField` / `field.SelectField`: label left, compact control right, rows the height of the Finances defaults rows, inside a `flush` `SettingsSection`.
