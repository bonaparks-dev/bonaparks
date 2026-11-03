// Shared by rendu-scan (reception, status, image) and rendu-scan-background
// (the call to the image model). Jobs live in Netlify Blobs.
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

export const store = () => getStore({ name: "rendus-scan", consistency: "strong" });

/** Key the iOS app sends; it only filters casual calls, the quotas do the real limiting. */
export const appKey = () => process.env.RENDU_CLE_APP || "bnpk-rendu-1-7f3c9a2e";
/** Lets only our own reception function start a background job. */
export const internalKey = () =>
  createHash("sha256").update("rendu-interne:" + (process.env.OPENAI_API_KEY || "")).digest("hex");

export const isId = (id: string | null): id is string =>
  !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id);

export type Job = {
  statut: "en_attente" | "en_cours" | "pret" | "erreur";
  creeLe: string;
  mobilier: Record<string, number>;
  pieces: number;
  message?: string;
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

/** RoomPlan furniture categories; anything else is dropped before reaching the prompt. */
export const CATEGORIES: Record<string, string> = {
  storage: "storage cabinet or wardrobe", refrigerator: "refrigerator", stove: "cooktop", bed: "bed", sink: "sink",
  washerDryer: "washing machine", toilet: "toilet", bathtub: "bathtub", oven: "oven", dishwasher: "dishwasher",
  table: "table", sofa: "sofa", chair: "chair", fireplace: "fireplace", stairs: "staircase", television: "television",
};

export function cleanFurniture(input: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!input || typeof input !== "object") return out;
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (k in CATEGORIES && Number.isInteger(v) && (v as number) > 0) out[k] = Math.min(50, v as number);
  }
  return out;
}

export function prompt(job: Job): string {
  const furniture = Object.entries(job.mobilier).map(([k, n]) => `${n} ${CATEGORIES[k]}${n > 1 ? "s" : ""}`).join(", ");
  return [
    "Turn this 3D cut-away model of a scanned home level into a photorealistic architectural visualization,",
    "seen from exactly the same high three-quarter camera angle and framing.",
    "Evening mood: warm interior lighting with soft shadows, dark surroundings, premium smart-home app style.",
    "Keep EXACTLY the same walls, room shapes, proportions, door gaps and window positions (windows are the pale blue glass strips),",
    "and the same position, size and orientation of every block of furniture. Do not add, remove or move rooms, walls, doors, windows or furniture.",
    "Walls stay cut at mid-height as in the input, with clean white wall tops.",
    "Replace the flat colored blocks by realistic materials and real furniture matching each block:",
    furniture ? `${furniture}.` : "no furniture was detected, keep the rooms empty.",
    "Light oak or stone flooring inside the rooms, a dark neutral ground around the building.",
    "Small plants and rugs are allowed only inside the rooms. No people, no animals, no text, no labels, no watermark.",
  ].join(" ");
}
