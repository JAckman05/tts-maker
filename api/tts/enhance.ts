import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error:
        "GEMINI_API_KEY is missing on Vercel. Please add GEMINI_API_KEY in your Vercel Project Settings > Environment Variables, then redeploy.",
    });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    if (!body || typeof body !== "object") {
      body = {};
    }

    const { promptText, currentStyle, persona, intention } = body;

    if (!promptText || typeof promptText !== "string") {
      res.status(400).json({ error: "promptText is required" });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const aiPrompt = `
You are a master vocal director and prompt engineer for Gemini 3.8 Flash TTS.
Gemini 3.8 Flash TTS supports expressive natural prosody, vocal bursts:
- <breath> (natural breath intake or pause)
- <laugh> (spontaneous laugh or chuckle)
- <gasp> (surprise or shock)
- <sigh> (relief or exhaustion)
- Backchanneling: |yeah|, |mhm|, |right|, |uh-huh|
- Speech metadata style directives (e.g. "Warm, contemplative narrator with gentle, measured pacing and intimate proximity to the microphone")

Input Text: "${promptText}"
Current Persona/Vibe: "${persona || 'Engaging speaker'}"
User Direction/Intention: "${intention || 'Make it sound natural, cinematic, and expressive'}"
Current Style Directive: "${currentStyle || ''}"

Return a JSON object with:
1. "enhancedText": The script enhanced with subtle, tasteful vocal markers (<breath>, <laugh>, <sigh>, <gasp>, or backchannels) and expressive punctuation. Do not over-saturate.
2. "suggestedStyle": A vivid 1-2 sentence directorial style prompt for Gemini TTS speechMetadata.style.
3. "tips": 2-3 brief bullet points explaining how this prompt brings the voice to life.

Respond ONLY with valid JSON matching:
{
  "enhancedText": string,
  "suggestedStyle": string,
  "tips": [string, string]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: aiPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const raw = response.text?.trim() || "{}";
    res.status(200).json(JSON.parse(raw));
  } catch (err: unknown) {
    console.error("Vercel prompt enhance error:", err);
    const message = err instanceof Error ? err.message : "Prompt enhancement failed";
    res.status(500).json({ error: message });
  }
}
