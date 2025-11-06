CREATE TABLE `qa_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` integer NOT NULL,
	`user_answer` text NOT NULL,
	`ai_model` text NOT NULL,
	`ai_response` text NOT NULL,
	`score` integer NOT NULL,
	`hints` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question` text NOT NULL,
	`model_answer` text NOT NULL,
	`reasoning` text NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
