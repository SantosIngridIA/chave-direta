import { env } from "cloudflare:workers";

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await context.params;
  const key = parts.join("/");
  if (!/^[a-zA-Z0-9_-]+\/[a-f0-9-]+\.(jpg|png|webp)$/.test(key)) return new Response("Imagem inválida", { status: 400 });
  const object = await env.BUCKET.get(key);
  if (!object) return new Response("Imagem não encontrada", { status: 404 });
  return new Response(object.body, { headers: { "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream", "Cache-Control": "public, max-age=31536000, immutable", ETag: object.etag } });
}
