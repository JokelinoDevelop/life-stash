CREATE TABLE `auth_challenges` (
	`challenge` text NOT NULL,
	`expires_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`purpose` text NOT NULL,
	`user_id` text
);
--> statement-breakpoint
CREATE TABLE `households` (
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `passkeys` (
	`counter` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`device_name` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`last_used_at` text,
	`public_key` text NOT NULL,
	`transports` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `passkeys_user_idx` ON `passkeys` (`user_id`);--> statement-breakpoint
CREATE TABLE `photos` (
	`content_type` text NOT NULL,
	`created_at` text NOT NULL,
	`household_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`object_key` text NOT NULL,
	`owner_id` text NOT NULL,
	`owner_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `photos_object_key_unique` ON `photos` (`object_key`);--> statement-breakpoint
CREATE INDEX `photos_owner_idx` ON `photos` (`owner_type`,`owner_id`);--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`auth` text NOT NULL,
	`created_at` text NOT NULL,
	`endpoint` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`p256dh` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_subscriptions_endpoint_unique` ON `push_subscriptions` (`endpoint`);--> statement-breakpoint
CREATE INDEX `push_subscriptions_user_idx` ON `push_subscriptions` (`user_id`);--> statement-breakpoint
CREATE TABLE `recovery_codes` (
	`code_hash` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`used_at` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recovery_codes_code_hash_unique` ON `recovery_codes` (`code_hash`);--> statement-breakpoint
CREATE INDEX `recovery_codes_user_idx` ON `recovery_codes` (`user_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`currency` text DEFAULT 'MKD' NOT NULL,
	`distance_unit` text DEFAULT 'km' NOT NULL,
	`locale` text DEFAULT 'en' NOT NULL,
	`odometer_nudge_weeks` integer DEFAULT 4 NOT NULL,
	`time_zone` text DEFAULT 'Europe/Skopje' NOT NULL,
	`user_id` text PRIMARY KEY NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`created_at` text NOT NULL,
	`display_name` text NOT NULL,
	`household_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `garage_cars` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`archived_at` text,
	`color` text,
	`fuel_type` text,
	`household_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`make` text,
	`model` text,
	`name` text NOT NULL,
	`notes` text,
	`odometer_nudged_at` text,
	`plate` text,
	`purchase_currency` text,
	`purchase_date` text,
	`purchase_date_precision` text,
	`purchase_odometer_km` integer,
	`purchase_price_minor` integer,
	`sold_date` text,
	`vin` text,
	`year` integer,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `garage_cars_household_idx` ON `garage_cars` (`household_id`);--> statement-breakpoint
CREATE TABLE `garage_expenses` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`car_id` text NOT NULL,
	`category` text NOT NULL,
	`currency` text NOT NULL,
	`date` text NOT NULL,
	`household_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`notes` text,
	`odometer_km` integer,
	`quantity_milli` integer,
	FOREIGN KEY (`car_id`) REFERENCES `garage_cars`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `garage_expenses_car_date_idx` ON `garage_expenses` (`car_id`,`date`);--> statement-breakpoint
CREATE TABLE `garage_items` (
	`archived_at` text,
	`created_at` text NOT NULL,
	`household_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `garage_items_household_idx` ON `garage_items` (`household_id`);--> statement-breakpoint
CREATE TABLE `garage_odometer_readings` (
	`car_id` text NOT NULL,
	`created_at` text NOT NULL,
	`date` text NOT NULL,
	`household_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`notes` text,
	`odometer_km` integer NOT NULL,
	FOREIGN KEY (`car_id`) REFERENCES `garage_cars`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `garage_readings_car_date_idx` ON `garage_odometer_readings` (`car_id`,`date`);--> statement-breakpoint
CREATE TABLE `garage_package_items` (
	`item_id` text NOT NULL,
	`package_id` text NOT NULL,
	PRIMARY KEY(`package_id`, `item_id`),
	FOREIGN KEY (`item_id`) REFERENCES `garage_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`package_id`) REFERENCES `garage_packages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `garage_packages` (
	`created_at` text NOT NULL,
	`household_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`notes` text,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `garage_packages_household_idx` ON `garage_packages` (`household_id`);--> statement-breakpoint
CREATE TABLE `garage_reminders` (
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
	`item_id` text,
	`kind` text NOT NULL,
	`notes` text,
	`notified_at` text,
	`package_id` text,
	`previous_reminder_id` text,
	`title` text NOT NULL,
	FOREIGN KEY (`car_id`) REFERENCES `garage_cars`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `garage_items`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`package_id`) REFERENCES `garage_packages`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `garage_reminders_car_idx` ON `garage_reminders` (`car_id`,`completed_at`);--> statement-breakpoint
CREATE INDEX `garage_reminders_household_idx` ON `garage_reminders` (`household_id`);--> statement-breakpoint
CREATE TABLE `garage_service_visit_items` (
	`cost_minor` integer,
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text,
	`label` text NOT NULL,
	`notes` text,
	`position` integer DEFAULT 0 NOT NULL,
	`visit_id` text NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `garage_items`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`visit_id`) REFERENCES `garage_service_visits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `garage_visit_items_visit_idx` ON `garage_service_visit_items` (`visit_id`);--> statement-breakpoint
CREATE INDEX `garage_visit_items_item_idx` ON `garage_service_visit_items` (`item_id`);--> statement-breakpoint
CREATE TABLE `garage_service_visits` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`by_previous_owner` integer DEFAULT false NOT NULL,
	`car_id` text NOT NULL,
	`currency` text NOT NULL,
	`date` text NOT NULL,
	`date_precision` text NOT NULL,
	`household_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`notes` text,
	`odometer_km` integer,
	`shop` text,
	`total_minor` integer,
	FOREIGN KEY (`car_id`) REFERENCES `garage_cars`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `garage_visits_car_date_idx` ON `garage_service_visits` (`car_id`,`date`);--> statement-breakpoint
CREATE INDEX `garage_visits_household_idx` ON `garage_service_visits` (`household_id`);