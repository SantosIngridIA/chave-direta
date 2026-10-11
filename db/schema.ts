import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const demoSessions = sqliteTable("demo_sessions", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const demoStates = sqliteTable("demo_states", {
  sessionId: text("session_id")
    .primaryKey()
    .references(() => demoSessions.id, { onDelete: "cascade" }),
  deposit: integer("deposit").notNull().default(1620),
  likedJson: text("liked_json").notNull().default("[1]"),
  proposalStatusJson: text("proposal_status_json")
    .notNull()
    .default('{"Mariana Souza":"pendente","Carlos Nunes":"pendente"}'),
  historyJson: text("history_json")
    .notNull()
    .default('["Proposta aceita para o Apartamento iluminado","Visita realizada em 9 de outubro de 2026","Imóvel adicionado aos favoritos"]'),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
