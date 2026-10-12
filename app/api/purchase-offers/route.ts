import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { purchaseOffers, userProfiles } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";
import { saleProperties } from "../../sale-properties";

const acquisitionMethods = new Set(["avista", "financiamento", "consorcio"]);

type OfferInput = {
  propertyId: string;
  offerAmount: number;
  acquisitionMethod: "avista" | "financiamento" | "consorcio";
  financialGuaranteeAmount: number;
  consortiumAdministrator?: string;
  consortiumCreditAmount?: number;
  consortiumContemplated?: boolean;
  documentaryGuaranteeAccepted: boolean;
};

function parseInput(value: unknown): OfferInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Partial<OfferInput>;
  if (typeof input.propertyId !== "string") return null;
  if (!Number.isInteger(input.offerAmount) || (input.offerAmount ?? 0) < 50_000 || (input.offerAmount ?? 0) > 100_000_000) return null;
  if (typeof input.acquisitionMethod !== "string" || !acquisitionMethods.has(input.acquisitionMethod)) return null;
  if (!Number.isInteger(input.financialGuaranteeAmount) || (input.financialGuaranteeAmount ?? 0) < 500 || (input.financialGuaranteeAmount ?? 0) > (input.offerAmount ?? 0)) return null;
  if (input.documentaryGuaranteeAccepted !== true) return null;
  if (input.acquisitionMethod === "consorcio") {
    if (typeof input.consortiumAdministrator !== "string" || input.consortiumAdministrator.trim().length < 2 || input.consortiumAdministrator.length > 100) return null;
    if (!Number.isInteger(input.consortiumCreditAmount) || (input.consortiumCreditAmount ?? 0) < 50_000 || (input.consortiumCreditAmount ?? 0) > 100_000_000) return null;
    if (input.consortiumContemplated !== true) return null;
  }
  return input as OfferInput;
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Entre para visualizar suas propostas." }, { status: 401 });

  const db = getDb();
  const offers = await db.select().from(purchaseOffers).where(eq(purchaseOffers.userId, user.id)).orderBy(desc(purchaseOffers.createdAt));
  return Response.json({ offers });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Entre para enviar uma proposta de compra." }, { status: 401 });

  const input = parseInput(await request.json());
  if (!input) return Response.json({ error: "Revise os valores, as garantias e a forma de aquisição." }, { status: 400 });

  const property = saleProperties.find((item) => item.id === input.propertyId);
  if (!property) return Response.json({ error: "Imóvel não encontrado." }, { status: 404 });

  const db = getDb();
  await db.insert(userProfiles).values({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
  }).onConflictDoUpdate({
    target: userProfiles.id,
    set: { email: user.email, fullName: user.fullName, updatedAt: sql`CURRENT_TIMESTAMP` },
  });

  const [offer] = await db.insert(purchaseOffers).values({
    id: crypto.randomUUID(),
    userId: user.id,
    propertyId: property.id,
    propertyTitle: property.title,
    askingPrice: property.price,
    offerAmount: input.offerAmount,
    acquisitionMethod: input.acquisitionMethod,
    financialGuaranteeAmount: input.financialGuaranteeAmount,
    consortiumAdministrator: input.acquisitionMethod === "consorcio" ? input.consortiumAdministrator!.trim() : null,
    consortiumCreditAmount: input.acquisitionMethod === "consorcio" ? input.consortiumCreditAmount : null,
    consortiumContemplated: input.acquisitionMethod === "consorcio",
    documentaryGuaranteeAccepted: true,
  }).returning();

  return Response.json({ offer }, { status: 201 });
}
