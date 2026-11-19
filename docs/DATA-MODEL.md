# LifeStash — Data model

All ids are random UUIDs (text). Timestamps are ISO-8601 UTC strings. Calendar dates are `YYYY-MM-DD` strings. Distances are integer **km**. Money is integer **minor units** with a `currency` (`MKD` | `EUR` | `USD`).

## Core

| Table | Columns |
| --- | --- |
| `households` | id, name, created_at |
| `users` | id, household_id, display_name, created_at |
| `user_preferences` | user_id (pk), locale (`en`/`mk`), distance_unit (`km`/`mi`), currency, time_zone, odometer_nudge_weeks |
| `passkeys` | id (credential id), user_id, public_key, counter, transports, device_name, created_at, last_used_at |
| `sessions` | id (sha256 of token), user_id, expires_at, created_at |
| `auth_challenges` | id, challenge, purpose (`register`/`login`/`add-passkey`), user_id?, expires_at |
| `recovery_codes` | id, user_id, code_hash, used_at |
| `push_subscriptions` | id, user_id, endpoint (unique), p256dh, auth, created_at |
| `photos` | id, household_id, object_key, content_type, size_bytes, owner_type (`service_visit`/`expense`), owner_id, created_at |

## Garage

### `garage_cars`

id, household_id, name, make, model, year, plate, vin, fuel_type, color, purchase_date, purchase_date_precision, purchase_odometer_km, purchase_price_minor, purchase_currency, notes, sold_date, archived_at, odometer_nudged_at, created_at, updated_at

### `garage_items` — the editable item catalog

id, household_id, name, archived_at, created_at

### `garage_packages` / `garage_package_items` — bundles of items

`garage_packages`: id, household_id, name, notes, created_at `garage_package_items`: package_id, item_id (pk: both)

### `garage_service_visits`

id, household_id, car_id, date, date_precision (`day`/`month`/`year`), odometer_km?, total_minor?, currency, kind (`maintenance`/`repair`), by_previous_owner (bool), shop?, notes?, created_at, updated_at

A partial date is normalised: month precision → `YYYY-MM-01`, year → `YYYY-01-01`, so the timeline sorts correctly while the UI shows only the known part.

### `garage_service_visit_items` — jobs under one invoice

id, visit_id, item_id? (catalog link), label (snapshot of the name), cost_minor?, notes?, position

### `garage_odometer_readings`

id, household_id, car_id, date, odometer_km, notes?, created_at

Service visits, expenses and the purchase odometer also count as readings when computing the latest odometer. Distance per year/month spreads each gap between readings evenly over the days it covers.

### `garage_reminders`

id, household_id, car_id, kind (`service`/`insurance`/`registration`/`other`), title, package_id?, item_id?, due_date?, due_odometer_km?, interval_months?, interval_km?, notes?, notified_at?, completed_at?, completed_visit_id?, completed_expense_id?, previous_reminder_id?, created_at, updated_at

Active reminders have `completed_at IS NULL`. At least one of `due_date` / `due_odometer_km` is required.

### `garage_expenses` — non-maintenance costs

id, household_id, car_id, category (`fuel`/`insurance`/`registration`/`tolls`/`parking`/`other`), date, amount_minor, currency, odometer_km?, quantity? (e.g. litres), notes?, created_at, updated_at

## Spending rules

- Maintenance/repair totals = sum of visit `total_minor` (or the sum of item costs when the total is blank), where `by_previous_owner = false`, grouped by car, year and currency.
- Expenses are reported separately by category and never included in maintenance totals.
- Mixed currencies are never converted; totals are grouped per currency.

## Finances

See `docs/FINANCES-SPEC.md` for the rules. Money is integer minor units plus a currency; totals are grouped per currency and never converted.

### `finance_categories`

id, household_id, kind (`income`/`expense`), name, icon? (lucide name from `CATEGORY_ICONS`), position, system_key? (`invoices`: used by "mark paid", can't be renamed, archived or deleted), archived_at?, created_at

Defaults are created (in the household's language) the first time Finances lists categories. A category in use is archived, not deleted.

### `finance_transactions`

id, household_id, kind (`income`/`expense`), date, amount_minor (always positive), currency, category_id, description, notes?, deleted_at?, created_at, updated_at

Indexes: (household_id, date), (household_id, category_id). `deleted_at` is a soft delete so a delete can be undone; the daily cron purges rows deleted more than 7 days ago.
