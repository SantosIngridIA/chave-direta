CREATE TABLE `purchase_offers` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`property_id` text NOT NULL,
	`property_title` text NOT NULL,
	`asking_price` integer NOT NULL,
	`offer_amount` integer NOT NULL,
	`acquisition_method` text NOT NULL,
	`financial_guarantee_amount` integer NOT NULL,
	`consortium_administrator` text,
	`consortium_credit_amount` integer,
	`consortium_contemplated` integer DEFAULT false NOT NULL,
	`documentary_guarantee_accepted` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'em_analise' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`full_name` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
