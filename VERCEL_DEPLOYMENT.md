# Deploying VoxPrompt Studio to Vercel

VoxPrompt Studio is configured with a Vite React frontend and Vercel Serverless Functions (`/api`), allowing 1-click hosting on [Vercel](https://vercel.com).

---

## Method 1: Deploy via GitHub (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for VoxPrompt Studio"
   git branch -M main
   git remote add origin https://github.com/your-username/voxprompt-studio.git
   git push -u origin main
   ```

2. **Import into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your GitHub repository.
   - Vercel will automatically detect the **Vite** framework preset and read `vercel.json`.

3. **Configure Environment Variables**:
   In the **Environment Variables** section before deploying:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Your Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/apikey).

4. **Click Deploy**:
   Vercel will build the frontend (`npm run build`) and automatically deploy the serverless functions in `/api/tts/`.

---

## Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm install -g vercel
   ```

2. **Login and link project**:
   ```bash
   vercel
   ```
   Follow the prompts to link to your Vercel account.

3. **Add Gemini API Key secret**:
   ```bash
   vercel env add GEMINI_API_KEY
   ```
   Paste your Gemini API key when prompted, and select `Production`, `Preview`, and `Development`.

4. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

---

## Project Structure on Vercel

- **Frontend Assets**: Built to `/dist` and served from Vercel's Global CDN with automatic client-side SPA routing.
- **Serverless API Routes**:
  - `POST /api/tts/generate` → Serverless function in `/api/tts/generate.ts` (calls `gemini-3.8-flash-tts`).
  - `POST /api/tts/enhance` → Serverless function in `/api/tts/enhance.ts` (calls `gemini-3.8-flash`).
- **Configuration**: `vercel.json` configures the Vite framework build and rewrites.
- **Local Development**: Run `npm run dev` to start the local Express + Vite development server.
