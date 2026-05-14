CREATE TABLE `user_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planData` text NOT NULL,
	`clientUpdatedAt` int unsigned NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_plans_userId_unique` UNIQUE(`userId`)
);
