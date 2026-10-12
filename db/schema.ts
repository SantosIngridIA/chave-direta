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

export const propertyListings = sqliteTable("property_listings", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => userProfiles.id, { onDelete: "cascade" }),
  dealType: text("deal_type").notNull(),
  propertyType: text("property_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  cep: text("cep").notNull(),
  street: text("street").notNull(),
  addressNumber: text("address_number").notNull(),
  complement: text("complement"),
  neighborhood: text("neighborhood").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  salePrice: integer("sale_price"),
  rentPrice: integer("rent_price"),
  condominiumFee: integer("condominium_fee").notNull().default(0),
  monthlyIptu: integer("monthly_iptu").notNull().default(0),
  bedrooms: integer("bedrooms").notNull().default(0),
  bathrooms: integer("bathrooms").notNull().default(0),
  parkingSpaces: integer("parking_spaces").notNull().default(0),
  areaM2: integer("area_m2").notNull(),
  furnished: integer("furnished", { mode: "boolean" }).notNull().default(false),
  petFriendly: integer("pet_friendly", { mode: "boolean" }).notNull().default(false),
  acquisitionMethodsJson: text("acquisition_methods_json").notNull().default("[]"),
  rentalGuaranteesJson: text("rental_guarantees_json").notNull().default("[]"),
  coverImageKey: text("cover_image_key"),
  status: text("status").notNull().default("ativo"),
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
