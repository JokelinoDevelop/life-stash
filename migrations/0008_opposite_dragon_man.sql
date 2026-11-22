ALTER TABLE `finance_business_profile` ADD `bank_address` text;--> statement-breakpoint
ALTER TABLE `finance_business_profile` ADD `bank_country` text;--> statement-breakpoint
ALTER TABLE `finance_invoices` ADD `purchase_order` text;--> statement-breakpoint
ALTER TABLE `finance_invoices` ADD `shipping_minor` integer DEFAULT 0 NOT NULL;