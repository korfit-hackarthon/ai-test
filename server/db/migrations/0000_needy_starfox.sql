CREATE TABLE `answer_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` integer NOT NULL,
	`initial_answer` text NOT NULL,
	`first_feedback` text,
	`second_feedback` text,
	`final_answer` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `interview_answers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`set_id` integer NOT NULL,
	`question_id` integer NOT NULL,
	`question_order` integer NOT NULL,
	`user_answer` text NOT NULL,
	`follow_up_question` text,
	`follow_up_answer` text,
	`created_at` integer,
	FOREIGN KEY (`set_id`) REFERENCES `interview_sets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `interview_evaluations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`set_id` integer NOT NULL,
	`logic` integer NOT NULL,
	`evidence` integer NOT NULL,
	`job_understanding` integer NOT NULL,
	`formality` integer NOT NULL,
	`completeness` integer NOT NULL,
	`overall_feedback` text NOT NULL,
	`detailed_feedback` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`set_id`) REFERENCES `interview_sets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `interview_sets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`job_type` text NOT NULL,
	`level` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer,
	`completed_at` integer
);
--> statement-breakpoint
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
	`category` text NOT NULL,
	`job_type` text,
	`level` text,
	`model_answer` text NOT NULL,
	`reasoning` text NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer
);
