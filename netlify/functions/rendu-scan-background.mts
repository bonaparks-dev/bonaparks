// Background function (up to 15 minutes): sends the stored model picture to
// the OpenAI image edit endpoint and stores the photorealistic JPEG.
import { internalKey, isId, prompt, store, type Job } from "../lib/rendu.mts";

async function edit(image: ArrayBuffer, text: string, withFidelity: boolean): Promise<Response> {
  const form = new FormData();
  form.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-2");
  form.append("image", new Blob([image], { type: "image/jpeg" }), "maquette.jpg");
  form.append("prompt", text);
  form.append("size", "1024x1536");
  form.append("quality", process.env.RENDU_QUALITE || "high");
  form.append("output_format", "jpeg");
  form.append("output_compression", "88");
  if (withFidelity) form.append("input_fidelity", "high");
  return fetch("https://api.openai.com/v1/images/edits", {
    method: "POST", headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: form,
  });
}

export default async (req: Request) => {
  if (req.headers.get("x-bonaparks-interne") !== internalKey() || !process.env.OPENAI_API_KEY) return;
  let id: string | null = null;
  try { id = (await req.json()).id; } catch { return; }
  if (!isId(id)) return;
  const s = store();
  const job = (await s.get(`jobs/${id}`, { type: "json" })) as Job | null;
  if (!job || job.statut !== "en_attente") return;
  await s.setJSON(`jobs/${id}`, { ...job, statut: "en_cours" });
  const fail = async (message: string): Promise<void> => { await s.setJSON(`jobs/${id}`, { ...job, statut: "erreur", message }); };
  try {
    const image = await s.get(`entrees/${id}`, { type: "arrayBuffer" });
    if (!image) { await fail("La maquette envoyée est introuvable. Relancez le rendu."); return; }
    let res = await edit(image, prompt(job), true);
    if (res.status === 400 && (await res.clone().text()).includes("input_fidelity")) res = await edit(image, prompt(job), false);
    if (!res.ok) {
      console.error("OpenAI", res.status, (await res.text()).slice(0, 500));
      await fail(res.status === 401 ? "Le rendu réaliste est mal configuré sur le serveur Bonaparks."
        : res.status === 429 ? "Le service d’images est saturé. Réessayez dans quelques minutes."
        : res.status === 400 ? "Le service d’images a refusé cette maquette. Réessayez." : "Le service d’images est indisponible. Réessayez plus tard.");
      return;
    }
    const data = (await res.json()) as { data?: { b64_json?: string }[] };
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) { await fail("Le service d’images n’a renvoyé aucune image. Réessayez."); return; }
    await s.set(`sorties/${id}`, Buffer.from(b64, "base64"));
    await s.setJSON(`jobs/${id}`, { ...job, statut: "pret" });
    await s.delete(`entrees/${id}`);
  } catch (error) {
    console.error("rendu-scan-background", error);
    await fail("Le rendu a échoué. Réessayez.");
  }
};
