import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { processTTSGeneration, processTTSEnhance } from "./src/server/ttsService";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "15mb" }));

// Single or Multi-Speaker TTS endpoint
app.post("/api/tts/generate", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await processTTSGeneration(req.body);
    res.json(result);
  } catch (err: unknown) {
    console.error("TTS generation error:", err);
    const message = err instanceof Error ? err.message : "TTS generation failed";
    res.status(500).json({ error: message });
  }
});

// Prompt enhancer helper endpoint
app.post("/api/tts/enhance", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await processTTSEnhance(req.body);
    res.json(result);
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
