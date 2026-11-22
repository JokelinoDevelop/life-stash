CREATE TABLE `finance_business_profile` (
	`address` text DEFAULT '' NOT NULL,
	`bank_name` text,
	`company_id` text,
	`default_vat_rate_bp` integer DEFAULT 0 NOT NULL,
	`email` text,
	`footer_note` text,
	`household_id` text PRIMARY KEY NOT NULL,
	`iban` text,
	`name` text NOT NULL,
	`phone` text,
	`swift` text,
	`tax_id` text,
	`updated_at` text NOT NULL,
	`vat_registered` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA defer_foreign_keys = on;--> statement-breakpoint
CREATE TABLE `__new_finance_invoices` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`client_id` text NOT NULL,
	`client_snapshot` text,
	`currency` text NOT NULL,
	`deleted_at` text,
	`description` text,
	`due_date` text NOT NULL,
	`household_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`issue_date` text NOT NULL,
	`issued_at` text,
	`issuer_snapshot` text,
	`notes` text,
	`number` text,
	`number_seq` integer,
	`number_year` integer,
	`overdue_notified_at` text,
	`paid_at` text,
	`period_end` text,
	`period_start` text,
	`project_id` text,
	`sent_at` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`voided_at` text,
	FOREIGN KEY (`client_id`) REFERENCES `finance_clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `finance_projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_finance_invoices`("created_at", "updated_at", "amount_minor", "client_id", "currency", "deleted_at", "description", "due_date", "household_id", "id", "issue_date", "notes", "number", "overdue_notified_at", "paid_at", "period_end", "period_start", "project_id", "sent_at", "status") SELECT "created_at", "updated_at", "amount_minor", "client_id", "currency", "deleted_at", "description", "due_date", "household_id", "id", "issue_date", "notes", "number", "overdue_notified_at", "paid_at", "period_end", "period_start", "project_id", "sent_at", "status" FROM `finance_invoices`;--> statement-breakpoint
DROP TABLE `finance_invoices`;--> statement-breakpoint
ALTER TABLE `__new_finance_invoices` RENAME TO `finance_invoices`;--> statement-breakpoint
PRAGMA defer_foreign_keys = off;--> statement-breakpoint
CREATE INDEX `finance_invoices_client_idx` ON `finance_invoices` (`household_id`,`client_id`);--> statement-breakpoint
ALTER TABLE `finance_clients` ADD `address` text;--> statement-breakpoint
ALTER TABLE `finance_clients` ADD `invoice_language` text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE `finance_clients` ADD `tax_id` text;
--> statement-breakpoint
-- F4 backfill. Drafts get their number when issued, so existing drafts lose theirs.
UPDATE `finance_invoices` SET `number` = NULL WHERE `status` = 'draft';--> statement-breakpoint
-- YYYY-NNN and YYYY/NNN: the year and sequence from the text.
UPDATE `finance_invoices` SET `number_year` = CAST(substr(`number`, 1, 4) AS INTEGER), `number_seq` = CAST(substr(`number`, 6) AS INTEGER)
  WHERE `number` GLOB '[0-9][0-9][0-9][0-9][-/][0-9]*' AND substr(`number`, 6) NOT GLOB '*[^0-9]*' AND length(`number`) <= 14 AND CAST(substr(`number`, 6) AS INTEGER) > 0;--> statement-breakpoint
-- A plain NNN (e.g. the Wise invoices 001–011) counts as a sequence of its issue year.
UPDATE `finance_invoices` SET `number_year` = CAST(substr(`issue_date`, 1, 4) AS INTEGER), `number_seq` = CAST(`number` AS INTEGER)
  WHERE `number_seq` IS NULL AND `number` <> '' AND `number` NOT GLOB '*[^0-9]*' AND length(`number`) <= 9 AND CAST(`number` AS INTEGER) > 0;--> statement-breakpoint
-- Two numbers that mean the same sequence ("011" and "2026-011"): only the oldest keeps it.
UPDATE `finance_invoices` SET `number_year` = NULL, `number_seq` = NULL
  WHERE `number_seq` IS NOT NULL AND `deleted_at` IS NULL AND `id` NOT IN (
    SELECT `id` FROM (
      SELECT `id`, ROW_NUMBER() OVER (PARTITION BY `household_id`, `number_year`, `number_seq` ORDER BY `created_at`, `id`) AS `rank`
      FROM `finance_invoices` WHERE `number_seq` IS NOT NULL AND `deleted_at` IS NULL
    ) WHERE `rank` = 1
  );--> statement-breakpoint
UPDATE `finance_invoices` SET `issued_at` = COALESCE(`sent_at`, `issue_date`) || 'T00:00:00.000Z' WHERE `status` <> 'draft';--> statement-breakpoint
UPDATE `finance_invoices` SET `voided_at` = `updated_at` WHERE `status` = 'void';--> statement-breakpoint
-- Clients write invoices in the household's language until changed.
UPDATE `finance_clients` SET `invoice_language` = COALESCE((
  SELECT `user_preferences`.`locale` FROM `users`
  INNER JOIN `user_preferences` ON `user_preferences`.`user_id` = `users`.`id`
  WHERE `users`.`household_id` = `finance_clients`.`household_id`
  ORDER BY `users`.`created_at` LIMIT 1
), 'en');--> statement-breakpoint
CREATE UNIQUE INDEX `finance_invoices_number_idx` ON `finance_invoices` (`household_id`,`number`) WHERE "finance_invoices"."deleted_at" IS NULL AND "finance_invoices"."number" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `finance_invoices_seq_idx` ON `finance_invoices` (`household_id`,`number_year`,`number_seq`) WHERE "finance_invoices"."deleted_at" IS NULL AND "finance_invoices"."number_seq" IS NOT NULL;
