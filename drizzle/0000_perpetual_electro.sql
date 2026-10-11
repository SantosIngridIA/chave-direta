CREATE TABLE `demo_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `demo_states` (
	`session_id` text PRIMARY KEY NOT NULL,
	`deposit` integer DEFAULT 1620 NOT NULL,
	`liked_json` text DEFAULT '[1]' NOT NULL,
	`proposal_status_json` text DEFAULT '{"Mariana Souza":"pendente","Carlos Nunes":"pendente"}' NOT NULL,
	`history_json` text DEFAULT '["Proposta aceita para o Apartamento iluminado","Visita realizada em 9 de outubro de 2026","Imóvel adicionado aos favoritos"]' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `demo_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
