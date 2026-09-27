import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // CORS configuration
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
        "GEMINI_API_KEY is missing on Vercel. Please go to your Vercel Project Settings > Environment Variables, add GEMINI_API_KEY (from Google AI Studio), and trigger a Redeploy.",
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

    const {
      mode = "single",
      text,
      style,
      voiceName = "Puck",
      dialogueSpeakers,
      dialogueParts,
    } = body;

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    if (mode === "single") {
      if (!text || typeof text !== "string" || !text.trim()) {
        res.status(400).json({ error: "Text is required for TTS generation." });
        return;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash-tts",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: text.trim(),
                speechMetadata: style?.trim() ? { style: style.trim() } : undefined,
              },
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName || "Puck" },
            },
          },
        },
      });

      const candidate = response.candidates?.[0];
      const inlineData = candidate?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;

      if (!inlineData?.data) {
        res.status(500).json({
          error: "No audio stream returned from Gemini TTS. Please verify prompt content or parameters.",
        });
        return;
      }

      res.status(200).json({
        audio: inlineData.data,
        mimeType: inlineData.mimeType || "audio/pcm;rate=24000",
        sampleRate: 24000,
      });
      return;
    } else {
      // Multi-speaker / dialogue mode
      if (!Array.isArray(dialogueSpeakers) || dialogueSpeakers.length !== 2) {
        res.status(400).json({
          error: "Gemini 3.8 Flash TTS multiSpeakerVoiceConfig requires exactly 2 speaker definitions.",
        });
        return;
      }

      if (!Array.isArray(dialogueParts) || dialogueParts.length === 0) {
        res.status(400).json({ error: "Dialogue lines (dialogueParts) are required." });
        return;
      }

      const spk1 = dialogueSpeakers[0];
      const spk2 = dialogueSpeakers[1];

      const parts = dialogueParts.map((item: { speaker: string; text: string; style?: string }) => ({
        text: `${item.speaker}: ${item.text}`,
        speechMetadata: {
          speaker: item.speaker,
          ...(item.style?.trim() ? { style: item.style.trim() } : {}),
        },
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash-tts",
        contents: [
          {
            role: "user",
            parts,
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: spk1.speaker,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: spk1.voiceName || "Puck" },
                  },
                },
                {
                  speaker: spk2.speaker,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: spk2.voiceName || "Kore" },
                  },
                },
              ],
            },
          },
        },
      });

      const candidate = response.candidates?.[0];
      const inlineData = candidate?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;

      if (!inlineData?.data) {
        res.status(500).json({
          error: "No audio generated for dialogue. Please check character names and lines.",
        });
        return;
      }

      res.status(200).json({
        audio: inlineData.data,
        mimeType: inlineData.mimeType || "audio/pcm;rate=24000",
        sampleRate: 24000,
      });
      return;
    }
  } catch (err: unknown) {
    console.error("Vercel TTS generation error:", err);
    const message = err instanceof Error ? err.message : "TTS generation failed";
    res.status(500).json({ error: message });
  }
}
