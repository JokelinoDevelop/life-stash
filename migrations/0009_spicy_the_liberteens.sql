CREATE TABLE `invites` (
	`created_at` text NOT NULL,
	`created_by_user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`household_id` text,
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`token_hash` text NOT NULL,
	`used_at` text,
	`used_by_user_id` text,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`used_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invites_token_hash_unique` ON `invites` (`token_hash`);--> statement-breakpoint
ALTER TABLE `users` ADD `disabled_at` text;--> statement-breakpoint
ALTER TABLE `users` ADD `is_admin` integer DEFAULT false NOT NULL;--> statement-breakpoint
-- The account created at first-run setup (the oldest user) becomes the admin.
UPDATE `users` SET `is_admin` = 1 WHERE `id` = (SELECT `id` FROM `users` ORDER BY `created_at` LIMIT 1);
