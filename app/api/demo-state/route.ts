import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "../../../db";
import { demoSessions, demoStates } from "../../../db/schema";

const COOKIE_NAME = "chave_direta_demo_session";
const DEFAULT_HISTORY = [
  "Proposta aceita para o Apartamento iluminado",
  "Visita realizada em 9 de outubro de 2026",
  "Imóvel adicionado aos favoritos",
];
const DEFAULT_PROPOSALS: Record<string, ProposalStatus> = {
  "Mariana Souza": "pendente",
  "Carlos Nunes": "pendente",
};

type ProposalStatus = "pendente" | "aceita" | "recusada";
type DemoStatePayload = {
  deposit: number;
  liked: number[];
  proposalStatus: Record<string, ProposalStatus>;
  history: string[];
};

function defaultState(): DemoStatePayload {
  return { deposit: 1620, liked: [1], proposalStatus: DEFAULT_PROPOSALS, history: DEFAULT_HISTORY };
}

function parseStoredState(row: typeof demoStates.$inferSelect): DemoStatePayload {
  try {
    return {
      deposit: row.deposit,
      liked: JSON.parse(row.likedJson),
      proposalStatus: JSON.parse(row.proposalStatusJson),
      history: JSON.parse(row.historyJson),
    };
  } catch {
    return defaultState();
  }
}

function validatePayload(value: unknown): DemoStatePayload | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Partial<DemoStatePayload>;
  const validStatuses = new Set(["pendente", "aceita", "recusada"]);
  if (!Number.isInteger(input.deposit) || (input.deposit ?? -1) < 0 || (input.deposit ?? 0) > 100_000_000) return null;
  if (!Array.isArray(input.liked) || input.liked.length > 100 || input.liked.some((id) => !Number.isInteger(id) || id < 1 || id > 1000)) return null;
  if (!input.proposalStatus || typeof input.proposalStatus !== "object" || Array.isArray(input.proposalStatus)) return null;
  const entries = Object.entries(input.proposalStatus);
  if (entries.length > 30 || entries.some(([name, status]) => name.length > 80 || !validStatuses.has(status))) return null;
  if (!Array.isArray(input.history) || input.history.length > 50 || input.history.some((event) => typeof event !== "string" || event.length > 200)) return null;
  return input as DemoStatePayload;
}

async function getOrCreateSession() {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(COOKIE_NAME)?.value;
  const db = getDb();

  if (sessionId) {
    const [session] = await db.select({ id: demoSessions.id }).from(demoSessions).where(eq(demoSessions.id, sessionId)).limit(1);
    if (session) return { db, sessionId };
  }

  sessionId = crypto.randomUUID();
  await db.insert(demoSessions).values({ id: sessionId });
  cookieStore.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return { db, sessionId };
}

export async function GET() {
  try {
    const { db, sessionId } = await getOrCreateSession();
    let [row] = await db.select().from(demoStates).where(eq(demoStates.sessionId, sessionId)).limit(1);
    if (!row) [row] = await db.insert(demoStates).values({ sessionId }).returning();
    return Response.json({ state: parseStoredState(row), persisted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar os dados";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = validatePayload(await request.json());
    if (!payload) return Response.json({ error: "Dados inválidos" }, { status: 400 });

    const cookieStore = await cookies();
    const sessionId = cookieStore.get(COOKIE_NAME)?.value;
    if (!sessionId) return Response.json({ error: "Sessão acadêmica não iniciada" }, { status: 401 });

    const db = getDb();
    const [session] = await db.select({ id: demoSessions.id }).from(demoSessions).where(eq(demoSessions.id, sessionId)).limit(1);
    if (!session) return Response.json({ error: "Sessão acadêmica inválida" }, { status: 401 });

    const [row] = await db.insert(demoStates).values({
      sessionId,
      deposit: payload.deposit,
      likedJson: JSON.stringify(payload.liked),
      proposalStatusJson: JSON.stringify(payload.proposalStatus),
      historyJson: JSON.stringify(payload.history),
    }).onConflictDoUpdate({
      target: demoStates.sessionId,
      set: {
        deposit: payload.deposit,
        likedJson: JSON.stringify(payload.liked),
        proposalStatusJson: JSON.stringify(payload.proposalStatus),
        historyJson: JSON.stringify(payload.history),
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    }).returning();

    await db.update(demoSessions).set({ updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(demoSessions.id, sessionId));
    return Response.json({ state: parseStoredState(row), persisted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao salvar os dados";
    return Response.json({ error: message }, { status: 500 });
  }
}
