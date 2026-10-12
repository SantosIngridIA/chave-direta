import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

const allowedTypes = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Entre para enviar uma foto." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) return Response.json({ error: "Selecione uma imagem." }, { status: 400 });
  const extension = allowedTypes.get(file.type);
  if (!extension || file.size > MAX_SIZE) return Response.json({ error: "Use JPG, PNG ou WebP de até 5 MB." }, { status: 400 });
  const key = `${user.id}/${crypto.randomUUID()}.${extension}`;
  await env.BUCKET.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type }, customMetadata: { ownerId: user.id } });
  return Response.json({ key, url: `/api/property-images/${key}` }, { status: 201 });
}
