CREATE TABLE `finance_invoice_lines` (
	`amount_minor` integer NOT NULL,
	`description` text NOT NULL,
	`household_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`position` integer NOT NULL,
	`quantity_milli` integer NOT NULL,
	`unit` text,
	`unit_price_minor` integer NOT NULL,
	`vat_minor` integer DEFAULT 0 NOT NULL,
	`vat_rate_bp` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invoice_id`) REFERENCES `finance_invoices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `finance_invoice_lines_invoice_idx` ON `finance_invoice_lines` (`household_id`,`invoice_id`);--> statement-breakpoint
ALTER TABLE `photos` ADD `generated` integer DEFAULT false NOT NULL;