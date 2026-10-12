import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { propertyListings, userProfiles } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";

const dealTypes = new Set(["aluguel", "venda", "ambos"]);
const propertyTypes = new Set(["apartamento", "casa", "studio", "kitnet", "sobrado", "terreno", "comercial", "chacara", "sitio", "galpao"]);
const acquisitionMethods = new Set(["avista", "financiamento", "consorcio"]);
const rentalGuarantees = new Set(["caucao", "fiador", "seguro_fianca"]);

type ListingInput = {
  dealType: string; propertyType: string; title: string; description: string;
  cep: string; street: string; addressNumber: string; complement?: string;
  neighborhood: string; city: string; state: string;
  salePrice?: number | null; rentPrice?: number | null; condominiumFee: number; monthlyIptu: number;
  bedrooms: number; bathrooms: number; parkingSpaces: number; areaM2: number;
  furnished: boolean; petFriendly: boolean; acquisitionMethods: string[]; rentalGuarantees: string[];
  coverImageKey?: string | null;
};

function cleanText(value: unknown, max: number, min = 1) {
  if (typeof value !== "string") return null;
  const result = value.trim();
  return result.length >= min && result.length <= max ? result : null;
}

function boundedInteger(value: unknown, min: number, max: number) {
  return Number.isInteger(value) && Number(value) >= min && Number(value) <= max ? Number(value) : null;
}

function parseInput(value: unknown): ListingInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Partial<ListingInput>;
  if (!input.dealType || !dealTypes.has(input.dealType) || !input.propertyType || !propertyTypes.has(input.propertyType)) return null;
  const title = cleanText(input.title, 100, 5); const description = cleanText(input.description, 1200, 20);
  const cep = cleanText(input.cep, 9, 8); const street = cleanText(input.street, 120); const addressNumber = cleanText(input.addressNumber, 20);
  const neighborhood = cleanText(input.neighborhood, 80); const city = cleanText(input.city, 80); const state = cleanText(input.state, 2, 2);
  if (!title || !description || !cep || !street || !addressNumber || !neighborhood || !city || !state) return null;
  const salePrice = input.dealType !== "aluguel" ? boundedInteger(input.salePrice, 10_000, 500_000_000) : null;
  const rentPrice = input.dealType !== "venda" ? boundedInteger(input.rentPrice, 100, 10_000_000) : null;
  if (input.dealType !== "aluguel" && salePrice === null) return null;
  if (input.dealType !== "venda" && rentPrice === null) return null;
  const condominiumFee = boundedInteger(input.condominiumFee, 0, 1_000_000);
  const monthlyIptu = boundedInteger(input.monthlyIptu, 0, 1_000_000);
  const bedrooms = boundedInteger(input.bedrooms, 0, 100); const bathrooms = boundedInteger(input.bathrooms, 0, 100);
  const parkingSpaces = boundedInteger(input.parkingSpaces, 0, 100); const areaM2 = boundedInteger(input.areaM2, 1, 10_000_000);
  if ([condominiumFee, monthlyIptu, bedrooms, bathrooms, parkingSpaces, areaM2].some((item) => item === null)) return null;
  const methods = Array.isArray(input.acquisitionMethods) ? input.acquisitionMethods.filter((item) => acquisitionMethods.has(item)) : [];
  const guarantees = Array.isArray(input.rentalGuarantees) ? input.rentalGuarantees.filter((item) => rentalGuarantees.has(item)) : [];
  if (input.dealType !== "aluguel" && methods.length === 0) return null;
  if (input.dealType !== "venda" && guarantees.length === 0) return null;
  const coverImageKey = input.coverImageKey == null ? null : cleanText(input.coverImageKey, 120);
  if (input.coverImageKey && !coverImageKey) return null;
  return { ...input, title, description, cep, street, addressNumber, neighborhood, city, state: state.toUpperCase(), complement: cleanText(input.complement ?? "", 80, 0) ?? "", salePrice, rentPrice, condominiumFee: condominiumFee!, monthlyIptu: monthlyIptu!, bedrooms: bedrooms!, bathrooms: bathrooms!, parkingSpaces: parkingSpaces!, areaM2: areaM2!, furnished: input.furnished === true, petFriendly: input.petFriendly === true, acquisitionMethods: [...new Set(methods)], rentalGuarantees: [...new Set(guarantees)], coverImageKey } as ListingInput;
}

function toResponse(row: typeof propertyListings.$inferSelect, includeAddress = false) {
  return {
    id: row.id, dealType: row.dealType, propertyType: row.propertyType, title: row.title, description: row.description,
    place: `${row.neighborhood}, ${row.city} - ${row.state}`, neighborhood: row.neighborhood, city: row.city, state: row.state,
    ...(includeAddress ? { cep: row.cep, street: row.street, addressNumber: row.addressNumber, complement: row.complement } : {}),
    salePrice: row.salePrice, rentPrice: row.rentPrice, condominiumFee: row.condominiumFee, monthlyIptu: row.monthlyIptu,
    bedrooms: row.bedrooms, bathrooms: row.bathrooms, parkingSpaces: row.parkingSpaces, areaM2: row.areaM2,
    furnished: row.furnished, petFriendly: row.petFriendly,
    acquisitionMethods: JSON.parse(row.acquisitionMethodsJson), rentalGuarantees: JSON.parse(row.rentalGuaranteesJson),
    image: row.coverImageKey ? `/api/property-images/${row.coverImageKey}` : "/property-1.png",
    status: row.status, createdAt: row.createdAt,
  };
}

export async function GET(request: Request) {
  const mine = new URL(request.url).searchParams.get("mine") === "1";
  const db = getDb();
  if (mine) {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "Entre para visualizar seus imóveis." }, { status: 401 });
    const rows = await db.select().from(propertyListings).where(eq(propertyListings.ownerId, user.id)).orderBy(desc(propertyListings.createdAt));
    return Response.json({ properties: rows.map((row) => toResponse(row, true)) });
  }
  const rows = await db.select().from(propertyListings).where(eq(propertyListings.status, "ativo")).orderBy(desc(propertyListings.createdAt));
  return Response.json({ properties: rows.map((row) => toResponse(row)) });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Entre para cadastrar um imóvel." }, { status: 401 });
  const input = parseInput(await request.json());
  if (!input) return Response.json({ error: "Revise os campos obrigatórios, valores e opções de garantia." }, { status: 400 });
  if (input.coverImageKey && !input.coverImageKey.startsWith(`${user.id}/`)) return Response.json({ error: "A foto não pertence à conta autenticada." }, { status: 403 });
  const db = getDb();
  await db.insert(userProfiles).values({ id: user.id, email: user.email, fullName: user.fullName }).onConflictDoUpdate({ target: userProfiles.id, set: { email: user.email, fullName: user.fullName, updatedAt: sql`CURRENT_TIMESTAMP` } });
  const [row] = await db.insert(propertyListings).values({
    id: crypto.randomUUID(), ownerId: user.id, dealType: input.dealType, propertyType: input.propertyType,
    title: input.title, description: input.description, cep: input.cep, street: input.street, addressNumber: input.addressNumber,
    complement: input.complement || null, neighborhood: input.neighborhood, city: input.city, state: input.state,
    salePrice: input.salePrice, rentPrice: input.rentPrice, condominiumFee: input.condominiumFee, monthlyIptu: input.monthlyIptu,
    bedrooms: input.bedrooms, bathrooms: input.bathrooms, parkingSpaces: input.parkingSpaces, areaM2: input.areaM2,
    furnished: input.furnished, petFriendly: input.petFriendly, acquisitionMethodsJson: JSON.stringify(input.acquisitionMethods),
    rentalGuaranteesJson: JSON.stringify(input.rentalGuarantees), coverImageKey: input.coverImageKey || null,
  }).returning();
  return Response.json({ property: toResponse(row, true) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Entre para gerenciar seus imóveis." }, { status: 401 });
  const body = await request.json() as { id?: string; status?: string };
  if (!body.id || !["ativo", "pausado"].includes(body.status ?? "")) return Response.json({ error: "Alteração inválida." }, { status: 400 });
  const db = getDb();
  const [existing] = await db.select().from(propertyListings).where(eq(propertyListings.id, body.id)).limit(1);
  if (!existing || existing.ownerId !== user.id) return Response.json({ error: "Imóvel não encontrado." }, { status: 404 });
  const [row] = await db.update(propertyListings).set({ status: body.status!, updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(propertyListings.id, body.id)).returning();
  return Response.json({ property: toResponse(row, true) });
}
