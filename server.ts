import express, { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "15mb" }));

// Server-side Gemini client initialization with mandatory User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Single or Multi-Speaker TTS endpoint powered by gemini-3.8-flash-tts
app.post("/api/tts/generate", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      mode = "single",
      text,
      style,
      voiceName = "Puck",
      dialogueSpeakers,
      dialogueParts,
    } = req.body;

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
          error: "No audio stream returned from Gemini TTS. Please check prompt content or parameters.",
        });
        return;
      }

      res.json({
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
          error: "No audio generated for dialogue. Please check the dialogue text and character names.",
        });
        return;
      }

      res.json({
        audio: inlineData.data,
        mimeType: inlineData.mimeType || "audio/pcm;rate=24000",
        sampleRate: 24000,
      });
      return;
    }
  } catch (err: unknown) {
    console.error("TTS generation error:", err);
    const message = err instanceof Error ? err.message : "TTS generation failed";
    res.status(500).json({ error: message });
  }
});

// Prompt enhancer helper to write professional TTS prompts with style and vocal burst annotations
app.post("/api/tts/enhance", async (req: Request, res: Response): Promise<void> => {
  try {
    const { promptText, currentStyle, persona, intention } = req.body;

    if (!promptText || typeof promptText !== "string") {
      res.status(400).json({ error: "promptText is required" });
      return;
    }

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
    const parsed = JSON.parse(raw);
    res.json(parsed);
  } catch (err: unknown) {
    console.error("Prompt enhance error:", err);
    const message = err instanceof Error ? err.message : "Prompt enhancement failed";
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VoxPrompt TTS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
