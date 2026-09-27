import type { VercelRequest, VercelResponse } from "@vercel/node";
import { processTTSEnhance } from "../../src/server/ttsService";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Please use POST." });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const result = await processTTSEnhance(body || {});
    res.status(200).json(result);
  } catch (err: unknown) {
    console.error("Vercel prompt enhance error:", err);
    const message = err instanceof Error ? err.message : "Prompt enhancement failed";
    res.status(500).json({ error: message });
  }
}
