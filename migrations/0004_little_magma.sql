CREATE TABLE `finance_projects` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`client_id` text NOT NULL,
	`household_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`notes` text,
	`status` text DEFAULT 'active' NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `finance_clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `finance_projects_client_idx` ON `finance_projects` (`household_id`,`client_id`);--> statement-breakpoint
CREATE TABLE `finance_recurring` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`amount_minor` integer NOT NULL,
	`category_id` text NOT NULL,
	`client_id` text,
	`currency` text NOT NULL,
	`day_of_month` integer NOT NULL,
	`description` text NOT NULL,
	`household_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`last_handled_month` text,
	FOREIGN KEY (`category_id`) REFERENCES `finance_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`client_id`) REFERENCES `finance_clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `finance_recurring_household_idx` ON `finance_recurring` (`household_id`);--> statement-breakpoint
ALTER TABLE `finance_invoices` ADD `overdue_notified_at` text;--> statement-breakpoint
ALTER TABLE `finance_invoices` ADD `project_id` text REFERENCES finance_projects(id);--> statement-breakpoint
ALTER TABLE `finance_transactions` ADD `recurring_id` text;