CREATE TABLE `finance_clients` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`archived_at` text,
	`currency` text NOT NULL,
	`email` text,
	`household_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`notes` text,
	`payment_terms_days` integer DEFAULT 30 NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `finance_clients_household_idx` ON `finance_clients` (`household_id`);--> statement-breakpoint
CREATE TABLE `finance_invoices` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`client_id` text NOT NULL,
	`currency` text NOT NULL,
	`deleted_at` text,
	`description` text,
	`due_date` text NOT NULL,
	`household_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`issue_date` text NOT NULL,
	`notes` text,
	`number` text NOT NULL,
	`paid_at` text,
	`period_end` text,
	`period_start` text,
	`sent_at` text,
	`status` text DEFAULT 'draft' NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `finance_clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `finance_invoices_number_idx` ON `finance_invoices` (`household_id`,`number`) WHERE "finance_invoices"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX `finance_invoices_client_idx` ON `finance_invoices` (`household_id`,`client_id`);--> statement-breakpoint
CREATE TABLE `finance_settings` (
	`default_payment_terms_days` integer DEFAULT 30 NOT NULL,
	`household_id` text PRIMARY KEY NOT NULL,
	`invoice_number_format` text DEFAULT 'YYYY-NNN' NOT NULL,
	`overdue_reminders` integer DEFAULT true NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `photos` ADD `file_name` text;--> statement-breakpoint
ALTER TABLE `finance_transactions` ADD `client_id` text REFERENCES finance_clients(id);--> statement-breakpoint
ALTER TABLE `finance_transactions` ADD `invoice_id` text REFERENCES finance_invoices(id);--> statement-breakpoint
CREATE UNIQUE INDEX `finance_transactions_invoice_idx` ON `finance_transactions` (`invoice_id`) WHERE "finance_transactions"."invoice_id" IS NOT NULL;