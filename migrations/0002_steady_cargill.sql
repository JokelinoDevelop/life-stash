CREATE TABLE `finance_categories` (
	`archived_at` text,
	`created_at` text NOT NULL,
	`household_id` text NOT NULL,
	`icon` text,
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`system_key` text,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `finance_categories_household_idx` ON `finance_categories` (`household_id`,`kind`);--> statement-breakpoint
CREATE TABLE `finance_transactions` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`category_id` text NOT NULL,
	`currency` text NOT NULL,
	`date` text NOT NULL,
	`deleted_at` text,
	`description` text NOT NULL,
	`household_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`notes` text,
	FOREIGN KEY (`category_id`) REFERENCES `finance_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `finance_transactions_date_idx` ON `finance_transactions` (`household_id`,`date`);--> statement-breakpoint
CREATE INDEX `finance_transactions_category_idx` ON `finance_transactions` (`household_id`,`category_id`);--> statement-breakpoint
CREATE INDEX `finance_transactions_deleted_idx` ON `finance_transactions` (`deleted_at`) WHERE "finance_transactions"."deleted_at" IS NOT NULL;