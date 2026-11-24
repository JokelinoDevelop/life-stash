CREATE TABLE `fitness_schedules` (
	`created_at` text NOT NULL,
	`end_date` text,
	`household_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`start_date` text NOT NULL,
	`training_id` text NOT NULL,
	`user_id` text NOT NULL,
	`weekdays` text NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`training_id`) REFERENCES `fitness_trainings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `fitness_schedules_user_idx` ON `fitness_schedules` (`household_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `fitness_schedules_training_idx` ON `fitness_schedules` (`training_id`);--> statement-breakpoint
CREATE TABLE `fitness_sessions` (
	`created_at` text NOT NULL,
	`date` text NOT NULL,
	`duration_minutes` integer,
	`household_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`note` text,
	`original_date` text,
	`schedule_id` text,
	`status` text NOT NULL,
	`title` text,
	`training_id` text,
	`updated_at` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`schedule_id`) REFERENCES `fitness_schedules`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`training_id`) REFERENCES `fitness_trainings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `fitness_sessions_date_idx` ON `fitness_sessions` (`household_id`,`user_id`,`date`);--> statement-breakpoint
CREATE INDEX `fitness_sessions_training_idx` ON `fitness_sessions` (`training_id`,`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `fitness_sessions_occurrence_idx` ON `fitness_sessions` (`schedule_id`,`original_date`) WHERE "fitness_sessions"."schedule_id" is not null;--> statement-breakpoint
CREATE TABLE `fitness_trainings` (
	`archived_at` text,
	`created_at` text NOT NULL,
	`description` text,
	`duration_minutes` integer,
	`household_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`updated_at` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `fitness_trainings_user_idx` ON `fitness_trainings` (`household_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `fitness_weight_entries` (
	`created_at` text NOT NULL,
	`date` text NOT NULL,
	`household_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`note` text,
	`user_id` text NOT NULL,
	`weight_grams` integer NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fitness_weight_entries_day_idx` ON `fitness_weight_entries` (`user_id`,`date`);--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `fitness_reminders` integer DEFAULT true NOT NULL;