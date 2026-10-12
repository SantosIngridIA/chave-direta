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

export const userProfiles = sqliteTable("user_profiles", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const purchaseOffers = sqliteTable("purchase_offers", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userProfiles.id, { onDelete: "cascade" }),
  propertyId: text("property_id").notNull(),
  propertyTitle: text("property_title").notNull(),
  askingPrice: integer("asking_price").notNull(),
  offerAmount: integer("offer_amount").notNull(),
  acquisitionMethod: text("acquisition_method").notNull(),
  financialGuaranteeAmount: integer("financial_guarantee_amount").notNull(),
  consortiumAdministrator: text("consortium_administrator"),
  consortiumCreditAmount: integer("consortium_credit_amount"),
  consortiumContemplated: integer("consortium_contemplated", { mode: "boolean" }).notNull().default(false),
  documentaryGuaranteeAccepted: integer("documentary_guarantee_accepted", { mode: "boolean" }).notNull().default(false),
  status: text("status").notNull().default("em_analise"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
