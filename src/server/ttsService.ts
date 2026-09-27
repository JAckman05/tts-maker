import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini SDK with User-Agent
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your Vercel Environment Variables or local .env file."
    );
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export interface TTSGenerateRequest {
  mode?: "single" | "dialogue";
  text?: string;
  style?: string;
  voiceName?: string;
  dialogueSpeakers?: Array<{ speaker: string; voiceName: string; style?: string }>;
  dialogueParts?: Array<{ speaker: string; text: string; style?: string }>;
}

export interface TTSGenerateResult {
  audio: string;
  mimeType: string;
  sampleRate: number;
}

export async function processTTSGeneration(
  body: TTSGenerateRequest
): Promise<TTSGenerateResult> {
  const ai = getGeminiClient();
  const {
    mode = "single",
    text,
    style,
    voiceName = "Puck",
    dialogueSpeakers,
    dialogueParts,
  } = body;

  if (mode === "single") {
    if (!text || typeof text !== "string" || !text.trim()) {
      throw new Error("Text is required for TTS generation.");
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
      throw new Error(
        "No audio stream returned from Gemini TTS. Please verify prompt content or parameters."
      );
    }

    return {
      audio: inlineData.data,
      mimeType: inlineData.mimeType || "audio/pcm;rate=24000",
      sampleRate: 24000,
    };
  } else {
    // Multi-speaker / dialogue mode
    if (!Array.isArray(dialogueSpeakers) || dialogueSpeakers.length !== 2) {
      throw new Error(
        "Gemini 3.8 Flash TTS multiSpeakerVoiceConfig requires exactly 2 speaker definitions."
      );
    }

    if (!Array.isArray(dialogueParts) || dialogueParts.length === 0) {
      throw new Error("Dialogue lines (dialogueParts) are required.");
    }

    const spk1 = dialogueSpeakers[0];
    const spk2 = dialogueSpeakers[1];

    const parts = dialogueParts.map((item) => ({
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
      throw new Error(
        "No audio generated for dialogue. Please check character names and lines."
      );
    }

    return {
      audio: inlineData.data,
      mimeType: inlineData.mimeType || "audio/pcm;rate=24000",
      sampleRate: 24000,
    };
  }
}

export interface TTSEnhanceRequest {
  promptText: string;
  currentStyle?: string;
  persona?: string;
  intention?: string;
}

export async function processTTSEnhance(body: TTSEnhanceRequest) {
  const ai = getGeminiClient();
  const { promptText, currentStyle, persona, intention } = body;

  if (!promptText || typeof promptText !== "string") {
    throw new Error("promptText is required");
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
  return JSON.parse(raw);
}
