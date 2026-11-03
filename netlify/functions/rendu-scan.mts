// POST: receives the cut-away model picture from the iOS app, checks the
// quotas and starts the background render. GET ?id: status, &image=1: the
// finished JPEG. DELETE ?id: forgets the job once the app has saved it.
import type { Context } from "@netlify/functions";
import { createHash, randomUUID } from "node:crypto";
import { appKey, cleanFurniture, internalKey, isId, json, store, type Job } from "../lib/rendu.mts";

const MAX_IMAGE = 4 * 1024 * 1024;
const today = () => new Date().toISOString().slice(0, 10);

async function bump(key: string, limit: number): Promise<boolean> {
  const s = store();
  const count = Number((await s.get(key)) || 0);
  if (count >= limit) return false;
  await s.set(key, String(count + 1));
  return true;
}

export default async (req: Request, context: Context) => {
  if (req.headers.get("x-bonaparks-app") !== appKey()) return json({ statut: "erreur", message: "Accès refusé." }, 403);
  const url = new URL(req.url);
  const s = store();

  if (req.method === "POST") {
    if (!process.env.OPENAI_API_KEY) {
      return json({ statut: "erreur", message: "Le rendu réaliste n’est pas encore activé sur le serveur Bonaparks." }, 503);
    }
    let body: { image?: unknown; mobilier?: unknown; pieces?: unknown };
    try { body = await req.json(); } catch { return json({ statut: "erreur", message: "Requête illisible." }, 400); }
    if (typeof body.image !== "string") return json({ statut: "erreur", message: "Image manquante." }, 400);
    const image = Buffer.from(body.image, "base64");
    if (image.length < 1000 || image.length > MAX_IMAGE || image[0] !== 0xff || image[1] !== 0xd8) {
      return json({ statut: "erreur", message: "Image refusée (JPEG de 4 Mo au plus)." }, 400);
    }
    const ip = createHash("sha256").update(context.ip || "inconnu").digest("hex").slice(0, 16);
    const perAddress = Number(process.env.RENDU_LIMITE_IP || 8);
    const perDay = Number(process.env.RENDU_LIMITE_JOUR || 150);
    if (!(await bump(`quotas/jour/${today()}`, perDay))) {
      return json({ statut: "erreur", message: "Trop de rendus aujourd’hui sur le service. Réessayez demain." }, 429);
    }
    if (!(await bump(`quotas/ip/${today()}/${ip}`, perAddress))) {
      return json({ statut: "erreur", message: `Limite de ${perAddress} rendus par jour atteinte. Réessayez demain.` }, 429);
    }
    const id = randomUUID();
    const pieces = Number.isInteger(body.pieces) ? Math.min(20, Math.max(1, body.pieces as number)) : 1;
    const job: Job = { statut: "en_attente", creeLe: new Date().toISOString(), mobilier: cleanFurniture(body.mobilier), pieces };
    await s.set(`entrees/${id}`, image);
    await s.setJSON(`jobs/${id}`, job);
    const start = await fetch(new URL("/.netlify/functions/rendu-scan-background", url), {
      method: "POST", headers: { "content-type": "application/json", "x-bonaparks-interne": internalKey() }, body: JSON.stringify({ id }),
    });
    if (start.status >= 300) {
      await s.setJSON(`jobs/${id}`, { ...job, statut: "erreur", message: "Le rendu n’a pas pu démarrer. Réessayez." });
      return json({ statut: "erreur", message: "Le rendu n’a pas pu démarrer. Réessayez." }, 502);
    }
    return json({ id, statut: "en_attente" }, 202);
  }

  const id = url.searchParams.get("id");
  if (!isId(id)) return json({ statut: "erreur", message: "Identifiant invalide." }, 400);

  if (req.method === "DELETE") {
    await Promise.all([s.delete(`jobs/${id}`), s.delete(`entrees/${id}`), s.delete(`sorties/${id}`)]);
    return json({ statut: "supprime" });
  }
  if (req.method !== "GET") return json({ statut: "erreur", message: "Méthode non prise en charge." }, 405);

  const job = (await s.get(`jobs/${id}`, { type: "json" })) as Job | null;
  if (!job) return json({ statut: "inconnu", message: "Ce rendu n’existe plus. Relancez-le." }, 200);
  if (url.searchParams.get("image") === "1") {
    if (job.statut !== "pret") return json({ statut: job.statut, message: "Le rendu n’est pas prêt." }, 409);
    const image = await s.get(`sorties/${id}`, { type: "arrayBuffer" });
    if (!image) return json({ statut: "erreur", message: "Image introuvable." }, 404);
    return new Response(image, { headers: { "content-type": "image/jpeg", "cache-control": "no-store" } });
  }
  return json({ statut: job.statut, message: job.message });
};
