ALTER TABLE `users` ADD `stripeCustomerId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `isProSubscriber` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `proActivatedAt` timestamp;