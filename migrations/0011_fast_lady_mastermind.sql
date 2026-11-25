-- Catalog items and packages are gone: service lines keep their own label, reminders lose the link.
PRAGMA defer_foreign_keys = on;--> statement-breakpoint
CREATE TABLE `__new_garage_reminders` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`car_id` text NOT NULL,
	`completed_at` text,
	`completed_expense_id` text,
	`completed_visit_id` text,
	`due_date` text,
	`due_odometer_km` integer,
	`household_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`interval_km` integer,
	`interval_months` integer,
	`kind` text NOT NULL,
	`notes` text,
	`notified_at` text,
	`previous_reminder_id` text,
	`title` text NOT NULL,
	FOREIGN KEY (`car_id`) REFERENCES `garage_cars`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_garage_reminders`("created_at", "updated_at", "car_id", "completed_at", "completed_expense_id", "completed_visit_id", "due_date", "due_odometer_km", "household_id", "id", "interval_km", "interval_months", "kind", "notes", "notified_at", "previous_reminder_id", "title") SELECT "created_at", "updated_at", "car_id", "completed_at", "completed_expense_id", "completed_visit_id", "due_date", "due_odometer_km", "household_id", "id", "interval_km", "interval_months", "kind", "notes", "notified_at", "previous_reminder_id", "title" FROM `garage_reminders`;--> statement-breakpoint
DROP TABLE `garage_reminders`;--> statement-breakpoint
ALTER TABLE `__new_garage_reminders` RENAME TO `garage_reminders`;--> statement-breakpoint
CREATE INDEX `garage_reminders_car_idx` ON `garage_reminders` (`car_id`,`completed_at`);--> statement-breakpoint
CREATE INDEX `garage_reminders_household_idx` ON `garage_reminders` (`household_id`);--> statement-breakpoint
CREATE TABLE `__new_garage_service_visit_items` (
	`cost_minor` integer,
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`notes` text,
	`position` integer DEFAULT 0 NOT NULL,
	`visit_id` text NOT NULL,
	FOREIGN KEY (`visit_id`) REFERENCES `garage_service_visits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_garage_service_visit_items`("cost_minor", "id", "label", "notes", "position", "visit_id") SELECT "cost_minor", "id", "label", "notes", "position", "visit_id" FROM `garage_service_visit_items`;--> statement-breakpoint
DROP TABLE `garage_service_visit_items`;--> statement-breakpoint
ALTER TABLE `__new_garage_service_visit_items` RENAME TO `garage_service_visit_items`;--> statement-breakpoint
CREATE INDEX `garage_visit_items_visit_idx` ON `garage_service_visit_items` (`visit_id`);--> statement-breakpoint
DROP TABLE `garage_package_items`;--> statement-breakpoint
DROP TABLE `garage_packages`;--> statement-breakpoint
DROP TABLE `garage_items`;--> statement-breakpoint
PRAGMA defer_foreign_keys = off;
